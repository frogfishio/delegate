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

  const ALT_TEST_ROLE = {
    code: 'alt_test_role_' + TIME,
    name: 'Alt Test Role ' + TIME,
    permissions: ['four', 'five', 'six'],
  };

  let adminToken;
  let testRoleId;
  let altTestRoleId;
  let testDelegateId;
  let testUserId;
  let testUserData;
  let activationCode;
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

  describe('Delegates', function () {
    it('should create a test role', async () => {
      testRoleId = (await engine.role.create(TEST_ROLE)).id;
    });

    it('should create alternative test role', async () => {
      altTestRoleId = (await engine.role.create(ALT_TEST_ROLE)).id;
    });

    it('should create a delegate with a test role', async () => {
      expect(
        (testDelegateId = (
          await request.post(
            `${API}/delegate`,
            {
              email: 'test@test.test',
              scope: 'test-scope',
              roles: [testRoleId],
            },
            adminToken
          )
        ).id)
      )
        .to.be.a('string')
        .with.length(36);
    });

    it('should return the created delegate', async () => {
      const result = await request.get(`${API}/delegate/${testDelegateId}`, null, adminToken);
      expect(result).to.have.property('_uuid').which.equals(testDelegateId);
      console.log(`!delegate ---> ${JSON.stringify(result, null, 2)}`);
      activationCode = result.code;
    });

    it('should return array of delegates', async () => {
      const result = await request.get(`${API}/delegates`, { _uuid: testDelegateId }, adminToken);
      expect(result).to.be.instanceof(Array).with.length(1);
      expect(result[0]).to.have.property('_uuid').which.equals(testDelegateId);
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

    it('get test user data', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      expect(testUserData).to.have.property('permissions').which.has.all.members(['member', 'read_assignable_roles']);
    });

    it('should activate delegate using code', async () => {
      const result = await request.get(`${API}/delegate/activate/${activationCode}`, { _uuid: testDelegateId }, token);
      console.log(`!result ---> ${JSON.stringify(result, null, 2)}`);
      expect(result).to.have.property('id').which.equals(testDelegateId);
    });

    it('get test user data with new grants', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      console.log(`!userdata --> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('global')
        .which.has.all.members(['member', 'read_assignable_roles']);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('test-scope')
        .which.has.all.members(['one', 'two', 'three']);
    });

    it('should add a new role to delegate', async () => {
      const result = await request.patch(
        `${API}/delegate/${testDelegateId}`,
        { roles: [testRoleId, altTestRoleId] },
        adminToken
      );
      expect(result).to.have.property('id').which.equals(testDelegateId);
    });

    it('should return modified delegate', async () => {
      const result = await request.get(`${API}/delegate/${testDelegateId}`, {}, adminToken);
      expect(result).to.have.property('roles').which.has.all.members([testRoleId, altTestRoleId]);
    });

    it('shoult return updated permissions', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      console.log(`!userdata --> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('global')
        .which.has.all.members(['member', 'read_assignable_roles']);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('test-scope')
        .which.has.all.members(['one', 'two', 'three', 'four', 'five', 'six']);
    });

    it('remove add a  role from delegate', async () => {
      const result = await request.patch(`${API}/delegate/${testDelegateId}`, { roles: [altTestRoleId] }, adminToken);
      expect(result).to.have.property('id').which.equals(testDelegateId);
    });

    it('shoult return permissions with role removed', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      console.log(`!userdata --> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('global')
        .which.has.all.members(['member', 'read_assignable_roles']);
      expect(testUserData)
        .to.have.property('permissions')
        .which.has.property('test-scope')
        .which.has.all.members(['four', 'five', 'six']);
    });

    it('should remove a delegate and its roles', async () => {
      const result = await request.del(`${API}/delegate/${testDelegateId}`, {}, adminToken);
      expect(result).to.have.property('id').which.equals(testDelegateId);
    });

    it('should fail getting deleted delegate', async () => {
      try {
        expect(await request.get(`${API}/delegate/${testDelegateId}`, {}, adminToken)).to.not.exist();
      } catch (err) {
        expect(err.error).to.equals('not_found');
      }
    });

    it('shoult return permissions delegate roles removed', async () => {
      token = (
        await engine.auth.authenticate({
          grant_type: 'password',
          email: `testuser${TIME}@frogfish.io`,
          password: 'testpassword',
        })
      ).access_token;

      testUserData = await engine.auth.resolve(`Bearer ${token}`);
      console.log(`!userdata --> ${JSON.stringify(testUserData, null, 2)}`);
      expect(testUserData).to.have.property('permissions').which.has.all.members(['member', 'read_assignable_roles']);
    });
  });
});
