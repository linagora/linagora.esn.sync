'use strict';

const EXPORTED_SYMBOLS = ['Calendars'];

/////

const Cu = Components.utils;
var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');
var extension = ExtensionParent.GlobalManager.getExtension('op-tb-autoconf@linagora.com');

let cal;

var { getLogger } = ChromeUtils.import(extension.rootURI.resolve('modules/Log.jsm'));
var { Utils } = ChromeUtils.import(extension.rootURI.resolve('modules/Utils.jsm'));
var { Prefs } = ChromeUtils.import(extension.rootURI.resolve('modules/Prefs.jsm'));

/////

const logger = getLogger('Calendars'),
      utils = new Utils(logger),
      CALDAV = 'caldav';

const Calendars = {

  setupCalendars: function(calendarSpecs) {
    try {
      cal = ChromeUtils.import('resource://calendar/modules/calUtils.jsm').cal;
    } catch (e) {
      throw new Error('Something went wrong when trying to import Lightning');
    }
    const davUrl = Prefs.get('extensions.op.autoconf.davUrl');

    calendarSpecs.forEach(calendarSpec => {
      const name = calendarSpec.name;
      let calendar = Calendars.find(name);

      calendarSpec.uri = utils.newURI(davUrl + calendarSpec.uri);

      if (!calendar) {
        logger.info('About to create a new ' + CALDAV + ' calendar ${name}', { name });

        calendar = cal.getCalendarManager().createCalendar(CALDAV, calendarSpec.uri);
        // Calendar should be visible and cached by default
        calendar.setProperty('calendar-main-in-composite', true);
        calendar.setProperty('cache.enabled', true);

        cal.getCalendarManager().registerCalendar(calendar);
      }

      utils.copyProperties(utils.omit(calendarSpec, 'username'), calendar);

      if (calendarSpec.color) {
        calendar.setProperty('color', calendarSpec.color);
      }
    });
  },

  find: function(name) {
    try {
      cal = ChromeUtils.import('resource://calendar/modules/calUtils.jsm').cal;
    } catch (e) {
      throw new Error('Something went wrong when trying to import Lightning');
    }
    const count = {},
        calendars = cal.getCalendarManager().getCalendars(count);

    logger.info('Searching calendar ${name} amongst ${count} registered calendars', { name, count: count.value });

    for (const i in calendars) {
      if (calendars.hasOwnProperty(i)) {
        const calendar = calendars[i],
            calName = calendar.name,
            calId = calendar.id;

        logger.debug(`Matching calendar ${calName} (${calId}) against ${name}`);

        if (calName === name) {
          logger.info(`Returning found calendar ${calId} matching ${name}`);

          return calendar;
        }
      }
    }

    return null;
  },

  isLightningInstalled: function() {
    try {
      cal = ChromeUtils.import('resource://calendar/modules/calUtils.jsm').cal;
    } catch (e) {
      throw new Error('Something went wrong when trying to import Lightning');
    }
    let isInstalled = (cal !== undefined) || false;

    logger.debug('Lightning is ' + (!isInstalled ? 'not ' : '') + 'installed !');

    return isInstalled;
  }
};
