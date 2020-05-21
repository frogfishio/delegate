import { Engine } from '@frogfish/kona';

let logger;
const error = require('@frogfish/kona/error');

export default class DelegateHandler {
  private _api;
  private _util;

  constructor(private _engine: Engine, user) {
    logger = _engine.log.log('service:delegate');
    this._api = _engine.delegate;
    this._util = require('@frogfish/kona/util');
  }

  async get(req, res, next) {
    try {
      return res.json(await this._api.get(req.path.split('/')[3]));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegate_get');
    }
  }

  async post(req, res, next) {
    try {
      return res.json(await this._api.create(req.body));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegate_create');
    }
  }

  async delete(req, res, next) {
    try {
      return res.json(await this._api.remove(req.path.split('/')[3]));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegate_del');
    }
  }

  async patch(req, res, next) {
    try {
      return res.json(await this._api.update(req.path.split('/')[3], req.body));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegate_update');
    }
  }
}
