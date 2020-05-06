import { Engine } from '@frogfish/kona';

let logger;

export default class AssignableRolesHandler {
  constructor(private _engine: Engine, private _user) {
    logger = _engine.log.log('service:roles:assignable');
  }

  async get(req, res, next) {
    try {
      return res.json(await this._engine.role.getUserRoles(this._user.id, { type: 'assignable' }));
    } catch (err) {
      err.send(res);
    }
  }
}
