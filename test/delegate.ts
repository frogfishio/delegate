import { Engine } from '@frogfish/kona';

let logger;
const request = require('@frogfish/kona/util/request');
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

describe('Role service', function () {
  let engine;

  const API = 'http://localhost:8000/v1';
  const TIME = Date.now();
  const TEST_ROLE = {
    code: 'test_role_' + TIME,
    name: 'Test Role ' + TIME,
    permissions: ['one', 'two', 'three'],
  };

  let adminToken;
  let testRoleId;
  let testScopedRoleId;
  let testUserId;
  let testUserData;
  let token;

  beforeEach(async () => {
    engine = await require('./helper').engine();
    adminToken =
      adminToken ||
      (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: 'testadmin@frogfish.io',
          password: 'testpassword',
        })
      ).access_token;
  });

  describe('Roles', function () {
    it('should create role', async () => {
      expect((testRoleId = (await request.post(`${API}/role`, TEST_ROLE, adminToken)).id))
        .to.be.a('string')
        .with.length(36);
    });

    it('should return the created role', async () => {
      const result = await request.get(`${API}/role/${testRoleId}`, null, adminToken);
      expect(result).to.have.property('_uuid').which.equals(testRoleId);
    });

    it('should return array of roles', async () => {
      const result = await request.get(`${API}/roles`, { _uuid: testRoleId }, adminToken);
      expect(result).to.be.instanceof(Array).with.length(1);
      expect(result[0]).to.have.property('_uuid').which.equals(testRoleId);
    });

    it('should update role', async () => {
      expect(await request.patch(`${API}/role/${testRoleId}`, { permissions: ['four', 'five', 'six'] }, adminToken))
        .to.have.property('id')
        .with.length(36)
        .which.equal(testRoleId);
    });

    it('should return updated role', async () => {
      const result = await request.get(`${API}/role/${testRoleId}`, null, adminToken);
      expect(result).to.have.property('_uuid').which.equals(testRoleId);
      expect(result).to.have.property('permissions').which.has.all.members(['four', 'five', 'six']);
    });

    it('should create test user', async () => {
      testUserId = (
        await engine.user.create({
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).id;
      expect(testUserId).to.be.a('string').with.length(36);
    });

    it('should add role to user', async () => {
      expect(await engine.user.addRoleToUser(testUserId, testRoleId))
        .to.have.property('id')
        .which.equals(testUserId);
    });

    it('get test user data', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.all.members(['member', 'read_assignable_roles', 'four', 'five', 'six']);
    });

    it('should return the created role', async () => {
      const result = await request.get(`${API}/roles/assignable`, null, token);
      expect(result).to.be.instanceof(Array).with.length(0);
    });

    it('should make role assignable', async () => {
      expect(await request.patch(`${API}/role/${testRoleId}`, { type: 'assignable' }, adminToken))
        .to.have.property('id')
        .with.length(36)
        .which.equal(testRoleId);
    });

    it('should return the created role', async () => {
      const result = await request.get(`${API}/roles/assignable`, null, token);
      console.log(`!roles ---------------------------> ${JSON.stringify(result, null, 2)}`);
      expect(result).to.be.instanceof(Array).with.length(1);
    });

    it('should create another role', async () => {
      expect(
        (testScopedRoleId = (
          await request.post(
            `${API}/role`,
            {
              code: 'scoped_test_role_' + TIME,
              name: 'Scoped Test Role ' + TIME,
              permissions: ['seven', 'eight', 'nine'],
            },
            adminToken
          )
        ).id)
      )
        .to.be.a('string')
        .with.length(36);
    });

    it('should add scoped to user', async () => {
      expect(await engine.user.addRoleToUser(testUserId, testScopedRoleId, 'test-scope'))
        .to.have.property('id')
        .which.equals(testUserId);
    });

    it('get modified user data', async () => {
      const token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);

      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('global')
        .which.has.all.members(['member', 'read_assignable_roles', 'four', 'five', 'six']);

      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('test-scope')
        .which.has.all.members(['seven', 'eight', 'nine']);
    });

    it('should delete scoped role', async () => {
      expect(await request.del(`${API}/role/${testScopedRoleId}`, null, adminToken))
        .to.have.property('id')
        .which.equals(testScopedRoleId);
    });

    it('should fail getting deleted scoped role', async () => {
      try {
        expect(await request.get(`${API}/role/${testScopedRoleId}`, {}, adminToken)).to.not.exist();
      } catch (err) {
        expect(err.error).to.equals('not_found');
      }
    });

    it('get modified user data after role deletion', async () => {
      const token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);

      console.log(`!testuserdata ======> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.all.members(['member', 'read_assignable_roles', 'four', 'five', 'six']);
    });

    it('should return global role', async () => {
      const result = await request.get(`${API}/role/${testRoleId}`, null, adminToken);
      expect(result).to.have.property('_uuid').which.equals(testRoleId);
    });

    it('should delete global role', async () => {
      expect(await request.del(`${API}/role/${testRoleId}`, null, adminToken))
        .to.have.property('id')
        .which.equals(testRoleId);
    });

    it('should fail getting deleted global role', async () => {
      try {
        expect(await request.get(`${API}/role/${testRoleId}`, {}, adminToken)).to.not.exist();
      } catch (err) {
        expect(err.error).to.equals('not_found');
      }
    });

    it('get modified user data after role deletion', async () => {
      const token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);

      console.log(`!testuserdata ======> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData).to.have.property('permissions').which.has.all.members(['member', 'read_assignable_roles']);
    });
  });
});
