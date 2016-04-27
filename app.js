var osmosis = require('osmosis');
var handlebars = require('handlebars');
var moment = require('moment');
var express = require('express');

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

var app = express();
app.get('/', function (req, res) {
    var calendar = [];

    osmosis
        .get('https://www.53cal.jp/areacalendar', {
            city: 1270133,
            area: 1270133132,
            yy: moment().year(),
            mm: moment().month(),
        })
        .find('#calendar .theday p,#calendar .saturday p, #calendar .sunday p, #calendar .today p')
        .set({day: 'img @src', kind: 'a @title'})
        .data(function(entry) {
            var kind = entry.kind.trim().replace(/\n+/, ', ');
            var day = parseInt(entry.day.match(/\d+/)[0], 10);

            if (kind === '') {
                return;
            }

            calendar.push({
                date: moment().date(day),
                kind: kind,
            });
        })
        .done(function() {
            var days = calendar.map(function(entry) {
                return {
                    formattedDay: entry.date.format('YYYYMMDD'),
                    formattedNextDay: entry.date.add(1, 'd').format('YYYYMMDD'),
                    kind: entry.kind,
                };
            })
            var ics = icsTemplate({days: days});

            res.send(ics);
        })
        .error(console.log);
});
app.get('/ping', function(req, res) {
    res.send('pong');
});

app.listen(5000, function () {
  console.log('Example app listening on port 5000!');
});

