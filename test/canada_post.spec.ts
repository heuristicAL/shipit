import fs from "fs";
import { CanadaPostClient, ICanadaPostRequestOptions } from "../src/carriers/canada_post";
import { ITrackitResponseData, STATUS_TYPES } from "../src/trackitClient";

const handleError = (e: unknown) => {
  if (e) {
    throw new Error("This should never have been reached");
  }
};

describe("canada post client", () => {
  let _canpostClient: CanadaPostClient = null;

  beforeAll(
    () =>
      (_canpostClient = new CanadaPostClient({
        username: "oh canada",
        password: "zamboni",
      }))
  );

  describe("delivered package", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_delivered.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of delivered", () => expect(_package.status).toBe(STATUS_TYPES.DELIVERED));

    it("has a service type of Expedited Parcels", () => expect(_package.service).toBe("Expedited Parcels"));

    it("has a destination of T3Z3J7", () => expect(_package.destination).toBe("T3Z3J7"));

    it("has 7 activities", () => expect(_package.activities).toHaveLength(7));

    it("has an eta of Sep 23", () => expect(_package.eta).toEqual(new Date("2015-09-23T00:00:00Z")));

    it("has first activity with timestamp, location and details", () => {
      const act = _package.activities[0];
      expect(act.timestamp).toEqual(new Date("2015-09-23T11:59:59.000Z"));
      expect(act.details).toBe("Item successfully delivered");
      expect(act.location).toBe("Calgary, AB");
    });

    it("has last activity with timestamp, location and details", () => {
      const act = _package.activities[6];
      expect(act.timestamp).toEqual(new Date("2015-09-21T13:49:14.000Z"));
      expect(act.details).toBe("Electronic information submitted by shipper");
      expect(act.location).toBe("Richmond, BC");
    });
  });

  describe("en-route package", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_en_route.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of en-route", () => expect(_package.status).toBe(STATUS_TYPES.EN_ROUTE));

    it("has a service type of Expedited Parcels", () => expect(_package.service).toBe("Expedited Parcels"));

    it("has a destination of L4J8A2", () => expect(_package.destination).toBe("L4J8A2"));

    it("has 4 activities", () => expect(_package.activities).toHaveLength(4));

    it("has an eta of Oct 01", () => expect(_package.eta).toEqual(new Date("2015-10-01T00:00:00Z")));

    it("has first activity with timestamp, location and details", () => {
      const act = _package.activities[0];
      expect(act.timestamp).toEqual(new Date("2015-10-01T06:04:27.000Z"));
      expect(act.details).toBe("Item processed");
      expect(act.location).toBe("Richmond Hill, ON");
    });

    it("has last activity with timestamp, location and details", () => {
      const act = _package.activities[3];
      expect(act.timestamp).toEqual(new Date("2015-09-30T18:34:49.000Z"));
      expect(act.details).toBe("Item processed");
      expect(act.location).toBe("Mississauga, ON");
    });
  });

  describe("shipping package", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_shipping.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of shipping", () => expect(_package.status).toBe(STATUS_TYPES.SHIPPING));

    it("has a service type of Expedited Parcels", () => expect(_package.service).toBe("Expedited Parcels"));

    it("has a destination of T3H5S3", () => expect(_package.destination).toBe("T3H5S3"));

    it("has 1 activity", () => expect(_package.activities).toHaveLength(1));

    it("has activity with timestamp, location and details", () => {
      const act = _package.activities[0];
      expect(act.timestamp).toEqual(new Date("2015-09-30T16:56:50.000Z"));
      expect(act.details).toBe("Electronic information submitted by shipper");
      expect(act.location).toBe("Saskatoon, SK");
    });
  });

  describe("another delivered package", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_delivered2.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of delivered", () => expect(_package.status).toBe(STATUS_TYPES.DELIVERED));
  });

  describe("delayed package", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_delayed.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of delayed", () => expect(_package.status).toBe(STATUS_TYPES.DELAYED));
  });

  describe("en-route package with a 'departed' activity", () => {
    let _package: ITrackitResponseData<ICanadaPostRequestOptions> = null;

    beforeAll((done) =>
      fs.readFile("test/stub_data/canada_post_departed.xml", "utf8", (err, xmlDoc) => {
        handleError(err);
        _canpostClient.presentResponse(xmlDoc, { trackingNumber: "trk" }).then(({ err: respErr, data: resp }) => {
          expect(respErr).toBeFalsy();
          _package = resp;
          done();
        }, handleError);
      })
    );

    it("has a status of en-route", () => expect(_package.status).toBe(STATUS_TYPES.EN_ROUTE));

    it("has a service type of Expedited Parcels", () => expect(_package.service).toBe("Expedited Parcels"));

    it("has a destination of X1A0A1", () => expect(_package.destination).toBe("X1A0A1"));

    it("has an eta of Mar 14", () => expect(_package.eta).toEqual(new Date("2016-03-14T00:00:00Z")));
  });
});
