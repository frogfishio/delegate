import { Engine } from '@frogfish/kona';

let logger;

export default class RoleHandler {
  constructor(private _engine: Engine, user) {
    logger = _engine.log.log('service:role');
  }

  async get(req, res, next) {
    try {
      return res.json(await this._engine.role.get(req.path.split('/')[3]));
    } catch (err) {
      err.send(res);
    }
  }

  async post(req, res, next) {
    try {
      return res.json(await this._engine.role.create(req.body));
    } catch (err) {
      err.send(res);
    }
  }

  async delete(req, res, next) {
    try {
      return res.json(await this._engine.role.remove(req.path.split('/')[3]));
    } catch (err) {
      err.send(res);
    }
  }

  async patch(req, res, next) {
    try {
      return res.json(
        await this._engine.role.update(req.path.split('/')[3], req.body)
      );
    } catch (err) {
      err.send(res);
    }
  }
}
