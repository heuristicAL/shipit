/* eslint-disable
	@typescript-eslint/restrict-template-expressions,
	@typescript-eslint/no-unsafe-member-access,
	@typescript-eslint/no-unsafe-assignment,
	@typescript-eslint/no-unsafe-return,
	@typescript-eslint/no-unsafe-call,
	node/no-callback-literal
*/
/* eslint-disable
    constructor-super,
    no-constant-condition,
    no-eval,
    no-return-assign,
    no-this-before-super,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { load } from "cheerio";
import moment from "moment-timezone";
import { IShipperResponse, ShipperClient, STATUS_TYPES } from "./shipper";

class UpsMiClient extends ShipperClient {
  private STATUS_MAP = new Map<string, STATUS_TYPES>([
    ["post office entry", STATUS_TYPES.EN_ROUTE],
    ["out for post office delivery", STATUS_TYPES.OUT_FOR_DELIVERY],
    ["shipment information received", STATUS_TYPES.SHIPPING], // This has to stay first so as to overrice the `['received', STATUS_TYPES.EN_ROUTE]` status
    ["delivered", STATUS_TYPES.DELIVERED],
    ["transferred", STATUS_TYPES.EN_ROUTE],
    ["received", STATUS_TYPES.EN_ROUTE],
    ["processed", STATUS_TYPES.EN_ROUTE],
    ["sorted", STATUS_TYPES.EN_ROUTE],
  ]);

  validateResponse(response: any): Promise<IShipperResponse> {
    const $ = load(response, { normalizeWhitespace: true });
    const summary = $("#Table6")?.find("table")?.[0];
    const uspsDetails = $("#ctl00_mainContent_ctl00_pnlUSPS > table");
    const miDetails = $("#ctl00_mainContent_ctl00_pnlMI > table");
    return Promise.resolve({
      shipment: {
        $,
        summary,
        uspsDetails,
        miDetails,
      },
    });
  }

  extractSummaryField(data, name) {
    let value = null;
    const { $, summary } = data;
    if (summary == null) {
      return;
    }
    $(summary)
      .children("tr")
      .each(function (rindex, row) {
        $(row)
          .children("td")
          .each(function (cindex, col) {
            const regex = new RegExp(name);
            if (regex.test($(col).text())) {
              value = $(col)?.next()?.text()?.trim();
            }
            if (value != null) {
              return false;
            }
          });
        if (value != null) {
          return false;
        }
      });
    return value;
  }

  getEta(data) {
    let formattedEta;
    const eta = this.extractSummaryField(data, "Projected Delivery Date");
    if (eta != null) {
      formattedEta = moment(new Date(eta));
    }
    if (formattedEta != null ? formattedEta.isValid() : undefined) {
      return formattedEta.toDate();
    } else {
      return undefined;
    }
  }

  getService() {
    return undefined;
  }

  getWeight(data) {
    const weight = this.extractSummaryField(data, "Weight");
    if (weight != null ? weight.length : undefined) {
      return `${weight} lbs.`;
    }
  }

  findStatusFromMap(statusText) {
    let status = STATUS_TYPES.UNKNOWN;
    if (statusText && statusText.length > 0) {
      for (const [key, value] of this.STATUS_MAP) {
        if (statusText?.toLowerCase().includes(key?.toLowerCase())) {
          status = value;
          break;
        }
      }
    }
    return status;
  }

  presentStatus(details: string) {
    return this.findStatusFromMap(details);
  }

  extractTimestamp(tsString) {
    if (tsString.match(":")) {
      return new Date(`${tsString} +0000`);
    } else {
      return new Date(`${tsString} 00:00 +0000`);
    }
  }

  extractActivities($, table) {
    const activities = [];
    $(table)
      .children("tr")
      .each((rindex, row) => {
        let location, timestamp;
        if (rindex === 0) {
          return;
        }
        let details = (location = timestamp = null);
        $(row)
          .children("td")
          .each((cindex, col) => {
            const value = $(col)?.text()?.trim();
            switch (cindex) {
              case 0:
                return (timestamp = this.extractTimestamp(value));
              case 1:
                return (details = value);
              case 2:
                return (location = this.presentLocationString(value));
            }
          });
        if (details != null && timestamp != null) {
          return activities.push({ details, location, timestamp });
        }
      });
    return activities;
  }

  getActivitiesAndStatus(data) {
    let status = null;
    const { $, uspsDetails, miDetails } = data;
    const set1 = this.extractActivities($, uspsDetails);
    const set2 = this.extractActivities($, miDetails);
    const activities = set1.concat(set2);
    for (const activity of Array.from(activities || [])) {
      if (status != null) {
        break;
      }
      status = this.presentStatus(
        activity != null ? activity.details : undefined
      );
    }

    return { activities, status };
  }

  getDestination(data) {
    const destination = this.extractSummaryField(data, "Zip Code");
    if (destination != null ? destination.length : undefined) {
      return destination;
    }
  }

  requestOptions({ trackingNumber }) {
    return {
      method: "GET",
      uri: `http://www.ups-mi.net/packageID/PackageID.aspx?PID=${trackingNumber}`,
    };
  }
}

export { UpsMiClient };
