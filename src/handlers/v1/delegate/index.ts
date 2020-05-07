import { Engine } from '@frogfish/kona';

let logger;
const error = require('@frogfish/kona/error');

export default class RoleHandler {
  private _api;
  private _error;

  constructor(private _engine: Engine, user) {
    logger = _engine.log.log('service:delegate');
    this._api = _engine.delegate;
  }

  async get(req, res, next) {
    try {
      return res.json(await this._api.get(req.path.split('/')[3]));
    } catch (err) {
      error.send(err, res);
    }
  }

  async post(req, res, next) {
    try {
      return res.json(await this._api.create(req.body));
    } catch (err) {
      error.send(err, res);
    }
  }

  async delete(req, res, next) {
    try {
      return res.json(await this._api.remove(req.path.split('/')[3]));
    } catch (err) {
      error.send(err, res);
    }
  }

  async patch(req, res, next) {
    try {
      return res.json(await this._api.update(req.path.split('/')[3], req.body));
    } catch (err) {
      error.send(err, res);
    }
  }
}
