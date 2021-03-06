var osmosis = require('osmosis');
var handlebars = require('handlebars');
var moment = require('moment');
var express = require('express');
var async = require('async');
var curry = require('curry');

var icsTemplate = handlebars.compile(
    'BEGIN:VCALENDAR\n' +
    'PRODID:Everyday Gomi\n' +
    'VERSION:2.0\n' +
    'METHOD:PUBLISH\n' +
    'CALSCALE:GREGORIAN\n' +
    'X-WR-CALNAME:ごみカレンダー\n' +
    'X-WR-CALDESC:ゴミの日の情報を配信します\n' +
    'X-WR-TIMEZONE:Asia/Tokyo\n' +
    '{{#days}}\n' +
    'BEGIN:VEVENT\n' +
    'UID:gomi/{{formattedDay}}\n' +
    'DESCRIPTION:\n' +
    'DTSTART:{{formattedDay}}\n' +
    'DTEND:{{formattedNextDay}}\n' +
    'SUMMARY:{{kind}}\n' +
    'END:VEVENT\n' +
    '{{/days}}\n' +
    'BEGIN:VTIMEZONE\n' +
    'TZID:Asia/Tokyo\n' +
    'BEGIN:STANDARD\n' +
    'DTSTART:19700101T000000\n' +
    'TZOFFSETFROM:+0900\n' +
    'TZOFFSETTO:+0900\n' +
    'END:STANDARD\n' +
    'END:VTIMEZONE\n' +
    'END:VCALENDAR'
);

var getCalendarFor = curry(function(city, area, date, cb) {
    var calendar = [];

    osmosis
    .get('https://www.53cal.jp/areacalendar', {
        city: city,
        area: area,
        yy: date.year(),
        mm: date.month() + 1,
    })
    .find('#calendar .theday p, #calendar .saturday p, ' +
          '#calendar .sunday p, #calendar .today p, #calendar .theday_sun p')
    .set({day: 'img @src', kind: 'a @title'})
    .data(function(entry) {
        var kind = entry.kind.trim().replace(/\n+/, ', ');
        var day = parseInt(entry.day.match(/\d+/)[0], 10);

        if (kind === '') {
            return;
        }

        calendar.push({
            date: moment(date).date(day),
            kind: kind,
        });
    })
    .done(function() {
        cb(null, calendar);
    })
    .error(function(err) {
        cb(err, null);
    });
});

module.exports.getCalendar = (event, context, callback) => {
    var today = moment();
    var nextWeek = moment().add(1, 'w');
    var dates = [today];
    if (today.month() != nextWeek.month()) {
        dates.push(nextWeek);
    }

    var params = event["queryStringParameters"];

    getCalendar = getCalendarFor(params["city"], params["area"]);
    async.concat(dates, getCalendar, function(err, calendar) {
        if (err) {
            return callback(err);
        }

        var days = calendar.map(function(entry) {
            return {
                formattedDay: entry.date.format('YYYYMMDD'),
                formattedNextDay: entry.date.add(1, 'd').format('YYYYMMDD'),
                kind: entry.kind,
            };
        })
        var ics = icsTemplate({days: days});

        callback(null, {
            statusCode: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8"
            },
            body: ics
        });
    });
};
