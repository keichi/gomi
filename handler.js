const osmosis = require("osmosis");
const handlebars = require("handlebars");
const moment = require("moment");
const async = require("async");

const icsTemplate = handlebars.compile(
  "BEGIN:VCALENDAR\n" +
    "PRODID:Everyday Gomi\n" +
    "VERSION:2.0\n" +
    "METHOD:PUBLISH\n" +
    "CALSCALE:GREGORIAN\n" +
    "X-WR-CALNAME:ごみカレンダー\n" +
    "X-WR-CALDESC:ゴミの日の情報を配信します\n" +
    "X-WR-TIMEZONE:Asia/Tokyo\n" +
    "{{#days}}\n" +
    "BEGIN:VEVENT\n" +
    "UID:gomi/{{formattedDay}}\n" +
    "DESCRIPTION:\n" +
    "DTSTART:{{formattedDay}}\n" +
    "DTEND:{{formattedNextDay}}\n" +
    "SUMMARY:{{kind}}\n" +
    "END:VEVENT\n" +
    "{{/days}}\n" +
    "BEGIN:VTIMEZONE\n" +
    "TZID:Asia/Tokyo\n" +
    "BEGIN:STANDARD\n" +
    "DTSTART:19700101T000000\n" +
    "TZOFFSETFROM:+0900\n" +
    "TZOFFSETTO:+0900\n" +
    "END:STANDARD\n" +
    "END:VTIMEZONE\n" +
    "END:VCALENDAR"
);

const getCalendarFor = (city, area, date, cb) => {
  const calendar = [];

  osmosis
    .get("https://www.53cal.jp/areacalendar", {
      city: city,
      area: area,
      yy: date.year(),
      mm: date.month() + 1,
    })
    .find(
      "#calendar .theday p, #calendar .saturday p, " +
        "#calendar .sunday p, #calendar .today p, #calendar .theday_sun p"
    )
    .set({ day: "img @src", kind: "a @title" })
    .data((entry) => {
      const kind = entry.kind.trim().replace(/\n+/, ", ");
      const day = parseInt(entry.day.match(/\d+/)[0], 10);

      if (kind === "") {
        return;
      }

      calendar.push({
        date: moment(date).date(day),
        kind: kind,
      });
    })
    .done(() => {
      cb(null, calendar);
    })
    .error((err) => {
      cb(err, null);
    });
};

module.exports.getCalendar = (event, context, callback) => {
  const today = moment();
  const nextWeek = moment().add(1, "w");
  const dates = [today];
  if (today.month() != nextWeek.month()) {
    dates.push(nextWeek);
  }

  const params = event["queryStringParameters"];
  const city = params["city"],
    area = params["area"];

  async.concat(
    dates,
    (date, cb) => getCalendarFor(city, area, date, cb),
    (err, calendar) => {
      if (err) {
        return callback(err);
      }

      const days = calendar.map((entry) => {
        return {
          formattedDay: entry.date.format("YYYYMMDD"),
          formattedNextDay: entry.date.add(1, "d").format("YYYYMMDD"),
          kind: entry.kind,
        };
      });

      const ics = icsTemplate({ days: days });

      callback(null, {
        statusCode: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
        },
        body: ics,
      });
    }
  );
};
