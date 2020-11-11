/* eslint-disable
	@typescript-eslint/restrict-template-expressions,
	@typescript-eslint/no-unsafe-member-access,
	@typescript-eslint/no-unsafe-assignment,
	@typescript-eslint/no-unsafe-return,
	@typescript-eslint/no-unsafe-call,
	node/no-callback-literal
*/
import moment from "moment-timezone";
/* eslint-disable
    constructor-super,
    no-constant-condition,
    no-eval,
    no-this-before-super,
    no-unused-vars
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
import { Parser } from "xml2js";
import {
  IShipperClientOptions,
  IShipperResponse,
  ShipperClient,
  STATUS_TYPES,
} from "./shipper";

interface IDhlClientOptions extends IShipperClientOptions {
  userId: string;
  password: string;
}

class DhlClient extends ShipperClient {
  private STATUS_MAP = new Map<string, STATUS_TYPES>([
    ["AD", STATUS_TYPES.EN_ROUTE],
    ["AF", STATUS_TYPES.EN_ROUTE],
    ["AR", STATUS_TYPES.EN_ROUTE],
    ["BA", STATUS_TYPES.DELAYED],
    ["BN", STATUS_TYPES.EN_ROUTE],
    ["BR", STATUS_TYPES.EN_ROUTE],
    ["CA", STATUS_TYPES.DELAYED],
    ["CC", STATUS_TYPES.OUT_FOR_DELIVERY],
    ["CD", STATUS_TYPES.DELAYED],
    ["CM", STATUS_TYPES.DELAYED],
    ["CR", STATUS_TYPES.EN_ROUTE],
    ["CS", STATUS_TYPES.DELAYED],
    ["DD", STATUS_TYPES.DELIVERED],
    ["DF", STATUS_TYPES.EN_ROUTE],
    ["DS", STATUS_TYPES.DELAYED],
    ["FD", STATUS_TYPES.EN_ROUTE],
    ["HP", STATUS_TYPES.DELAYED],
    ["IC", STATUS_TYPES.EN_ROUTE],
    ["MC", STATUS_TYPES.DELAYED],
    ["MD", STATUS_TYPES.EN_ROUTE],
    ["MS", STATUS_TYPES.DELAYED],
    ["ND", STATUS_TYPES.DELAYED],
    ["NH", STATUS_TYPES.DELAYED],
    ["OH", STATUS_TYPES.DELAYED],
    ["OK", STATUS_TYPES.DELIVERED],
    ["PD", STATUS_TYPES.EN_ROUTE],
    ["PL", STATUS_TYPES.EN_ROUTE],
    ["PO", STATUS_TYPES.EN_ROUTE],
    ["PU", STATUS_TYPES.EN_ROUTE],
    ["RD", STATUS_TYPES.DELAYED],
    ["RR", STATUS_TYPES.DELAYED],
    ["RT", STATUS_TYPES.DELAYED],
    ["SA", STATUS_TYPES.SHIPPING],
    ["SC", STATUS_TYPES.DELAYED],
    ["SS", STATUS_TYPES.DELAYED],
    ["TD", STATUS_TYPES.DELAYED],
    ["TP", STATUS_TYPES.OUT_FOR_DELIVERY],
    ["TR", STATUS_TYPES.EN_ROUTE],
    ["UD", STATUS_TYPES.DELAYED],
    ["WC", STATUS_TYPES.OUT_FOR_DELIVERY],
    ["WX", STATUS_TYPES.DELAYED],
  ]);

  get userId(): string {
    return this.options.userId;
  }

  get password(): string {
    return this.options.password;
  }

  options: IDhlClientOptions;
  parser: Parser;

  constructor(options: IDhlClientOptions) {
    super(options);
    // Todo: Check if this works
    // this.options = options;
    this.parser = new Parser();
  }

  generateRequest(trk) {
    return `\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<req:KnownTrackingRequest xmlns:req="http://www.dhl.com">
  <Request>
    <ServiceHeader>
      <SiteID>${this.userId}</SiteID>
      <Password>${this.password}</Password>
    </ServiceHeader>
  </Request>
  <LanguageCode>en</LanguageCode>
  <AWBNumber>${trk}</AWBNumber>
  <LevelOfDetails>ALL_CHECK_POINTS</LevelOfDetails>
</req:KnownTrackingRequest>\
`;
  }

  async validateResponse(response: any): Promise<IShipperResponse> {
    this.parser.reset();
    try {
      const trackResult = await new Promise<any>((resolve, reject) => {
        this.parser.parseString(response, (xmlErr, trackResult) => {
          if (xmlErr) {
            reject(xmlErr);
          } else {
            resolve(trackResult);
          }
        });
      });

      if (trackResult == null) {
        return { err: new Error("TrackResult is empty") };
      }

      const trackingResponse = trackResult["req:TrackingResponse"];
      if (trackingResponse == null) {
        return { err: new Error("no tracking response") };
      }
      const awbInfo =
        trackingResponse.AWBInfo != null
          ? trackingResponse.AWBInfo[0]
          : undefined;
      if (awbInfo == null) {
        return { err: new Error("no AWBInfo in response") };
      }
      const shipment =
        awbInfo.ShipmentInfo != null ? awbInfo.ShipmentInfo[0] : undefined;
      if (shipment == null) {
        return { err: new Error("could not find shipment") };
      }
      const trackStatus =
        awbInfo.Status != null ? awbInfo.Status[0] : undefined;
      const statusCode =
        trackStatus != null ? trackStatus.ActionStatus : undefined;
      if (statusCode.toString() !== "success") {
        return { err: new Error(`unexpected track status code=${statusCode}`) };
      }
      return { shipment: shipment };
    } catch (e) {
      return { err: e };
    }
  }

  getEta(shipment) {
    const eta =
      shipment.EstDlvyDate != null ? shipment.EstDlvyDate[0] : undefined;
    const formatSpec = "YYYYMMDD HHmmss ZZ";
    if (eta != null) {
      return moment(eta, formatSpec).toDate();
    }
  }

  getService(shipment) {
    return undefined;
  }

  getWeight(shipment) {
    const weight = shipment.Weight != null ? shipment.Weight[0] : undefined;
    if (weight != null) {
      return `${weight} LB`;
    }
  }

  presentTimestamp(dateString, timeString) {
    if (dateString == null) {
      return;
    }
    if (timeString == null) {
      timeString = "00:00";
    }
    const inputString = `${dateString} ${timeString} +0000`;
    const formatSpec = "YYYYMMDD HHmmss ZZ";
    return moment(inputString, formatSpec).toDate();
  }

  presentAddress(rawAddress: string) {
    let city, countryCode, stateCode;
    if (rawAddress == null) {
      return;
    }
    const firstComma = rawAddress.indexOf(",");
    const firstDash = rawAddress.indexOf("-", firstComma);
    if (firstComma > -1 && firstDash > -1) {
      city = rawAddress.substring(0, firstComma).trim();
      stateCode = rawAddress.substring(firstComma + 1, firstDash).trim();
      countryCode = rawAddress.substring(firstDash + 1).trim();
    } else if (firstComma < 0 && firstDash > -1) {
      city = rawAddress.substring(0, firstDash).trim();
      stateCode = null;
      countryCode = rawAddress.substring(firstDash + 1).trim();
    } else {
      return rawAddress;
    }
    city = city.replace(" HUB", "");
    city = city.replace(" GATEWAY", "");
    return this.presentLocation({
      city,
      stateCode,
      countryCode,
      postalCode: null,
    });
  }

  presentDetails(rawAddress, rawDetails) {
    if (rawDetails == null) {
      return;
    }
    if (rawAddress == null) {
      return rawDetails;
    }
    return rawDetails
      .replace(/\s\s+/, " ")
      .trim()
      .replace(new RegExp(`(?: at| in)? ${rawAddress.trim()}$`), "");
  }

  presentStatus(status) {
    return this.STATUS_MAP.get(status) || STATUS_TYPES.UNKNOWN;
  }

  getActivitiesAndStatus(shipment) {
    const activities = [];
    let status = null;
    let rawActivities: any[] = shipment.ShipmentEvent;
    if (rawActivities == null) {
      rawActivities = [];
    }
    rawActivities.reverse();
    for (const rawActivity of Array.from(rawActivities || [])) {
      const rawLocation = rawActivity?.ServiceArea?.[0]?.Description?.[0];
      const location = this.presentAddress(rawLocation);
      const timestamp = this.presentTimestamp(
        rawActivity.Date != null ? rawActivity.Date[0] : undefined,
        rawActivity.Time != null ? rawActivity.Time[0] : undefined
      );
      let details = this.presentDetails(
        rawLocation,
        rawActivity?.ServiceEvent?.[0]?.Description?.[0]
      );
      if (details != null && timestamp != null) {
        details =
          details.slice(-1) === "."
            ? details.slice(0, +-2 + 1 || undefined)
            : details;
        const activity = { timestamp, location, details };
        activities.push(activity);
      }
      if (!status) {
        status = this.presentStatus(
          rawActivity?.ServiceEvent?.[0]?.EventCode?.[0]
        );
      }
    }
    return { activities, status };
  }

  getDestination(shipment) {
    const destination = shipment?.DestinationServiceArea?.[0]?.Description?.[0];
    if (destination == null) {
      return;
    }
    return this.presentAddress(destination);
  }

  requestOptions({ trackingNumber }) {
    return {
      method: "POST",
      uri: "http://xmlpi-ea.dhl.com/XMLShippingServlet",
      body: this.generateRequest(trackingNumber),
    };
  }
}

export { DhlClient };
