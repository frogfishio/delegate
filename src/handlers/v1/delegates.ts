import { Engine } from '@frogfish/kona';

let logger;

export default class DelegatesHandler {
  private _util;
  constructor(private _engine: Engine, user) {
    logger = _engine.log.log('service:delegates');
    this._util = require('@frogfish/kona/util');
  }

  async get(req, res, next) {
    try {
      return res.json(await this._engine.delegate.find(req.query, req.path.split('/')[3], req.path.split('/')[4]));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegates_get');
    }
  }
}
