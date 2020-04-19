/* eslint-disable
    handle-callback-err,
    no-return-assign,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import fs from 'fs'
import assert from 'assert'
import { expect } from 'chai'
import bond from 'bondjs'
import { CanadaPostClient } from '../lib/canada_post'
import { ShipperClient } from '../lib/shipper'
import { Builder, Parser } from 'xml2js'
const should = require('chai').should()

describe('canada post client', function () {
  let _canpostClient = null
  const _xmlParser = new Parser()
  const _xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

  before(() => _canpostClient = new CanadaPostClient({
    username: 'oh canada',
    password: 'zamboni'
  }))

  describe('delivered package', function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_delivered.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    it('has a status of delivered', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.DELIVERED))

    it('has a service type of Expedited Parcels', () => expect(_package.service).to.equal('Expedited Parcels'))

    it('has a destination of T3Z3J7', () => expect(_package.destination).to.equal('T3Z3J7'))

    it('has 7 activities', () => expect(_package.activities).to.have.length(7))

    it('has an eta of Sep 23', () => expect(_package.eta).to.deep.equal(new Date('2015-09-23T23:59:59Z')))

    it('has first activity with timestamp, location and details', function () {
      const act = _package.activities[0]
      expect(act.timestamp).to.deep.equal(new Date('2015-09-23T11:59:59.000Z'))
      expect(act.details).to.equal('Item successfully delivered')
      return expect(act.location).to.equal('Calgary, AB')
    })

    return it('has last activity with timestamp, location and details', function () {
      const act = _package.activities[6]
      expect(act.timestamp).to.deep.equal(new Date('2015-09-21T13:49:14.000Z'))
      expect(act.details).to.equal('Electronic information submitted by shipper')
      return expect(act.location).to.equal('Richmond, BC')
    })
  })

  describe('en-route package', function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_en_route.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    it('has a status of en-route', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.EN_ROUTE))

    it('has a service type of Expedited Parcels', () => expect(_package.service).to.equal('Expedited Parcels'))

    it('has a destination of L4J8A2', () => expect(_package.destination).to.equal('L4J8A2'))

    it('has 4 activities', () => expect(_package.activities).to.have.length(4))

    it('has an eta of Oct 01', () => expect(_package.eta).to.deep.equal(new Date('2015-10-01T23:59:59Z')))

    it('has first activity with timestamp, location and details', function () {
      const act = _package.activities[0]
      expect(act.timestamp).to.deep.equal(new Date('2015-10-01T06:04:27.000Z'))
      expect(act.details).to.equal('Item processed')
      return expect(act.location).to.equal('Richmond Hill, ON')
    })

    return it('has last activity with timestamp, location and details', function () {
      const act = _package.activities[3]
      expect(act.timestamp).to.deep.equal(new Date('2015-09-30T18:34:49.000Z'))
      expect(act.details).to.equal('Item processed')
      return expect(act.location).to.equal('Mississauga, ON')
    })
  })

  describe('shipping package', function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_shipping.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    it('has a status of shipping', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.SHIPPING))

    it('has a service type of Expedited Parcels', () => expect(_package.service).to.equal('Expedited Parcels'))

    it('has a destination of T3H5S3', () => expect(_package.destination).to.equal('T3H5S3'))

    it('has 1 activity', () => expect(_package.activities).to.have.length(1))

    return it('has activity with timestamp, location and details', function () {
      const act = _package.activities[0]
      expect(act.timestamp).to.deep.equal(new Date('2015-09-30T16:56:50.000Z'))
      expect(act.details).to.equal('Electronic information submitted by shipper')
      return expect(act.location).to.equal('Saskatoon, SK')
    })
  })

  describe('another delivered package', function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_delivered2.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    return it('has a status of delivered', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.DELIVERED))
  })

  describe('delayed package', function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_delayed.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    return it('has a status of delayed', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.DELAYED))
  })

  return describe("en-route package with a 'departed' activity", function () {
    let _package = null

    before(done => fs.readFile('test/stub_data/canada_post_departed.xml', 'utf8', (err, xmlDoc) => _canpostClient.presentResponse(xmlDoc, 'trk', function (err, resp) {
      should.not.exist(err)
      _package = resp
      return done()
    })))

    it('has a status of en-route', () => expect(_package.status).to.equal(ShipperClient.STATUS_TYPES.EN_ROUTE))

    it('has a service type of Expedited Parcels', () => expect(_package.service).to.equal('Expedited Parcels'))

    it('has a destination of X1A0A1', () => expect(_package.destination).to.equal('X1A0A1'))

    return it('has an eta of Mar 14', () => expect(_package.eta).to.deep.equal(new Date('2016-03-14T23:59:59Z')))
  })
})