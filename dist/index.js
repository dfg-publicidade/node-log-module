"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ipware_1 = __importDefault(require("ipware"));
/* Module */
class Log {
    static async emit(app, req, collectionName, obj) {
        const collection = app.db.collection(collectionName);
        const getIp = ipware_1.default().get_ip;
        const log = {};
        log.app = app.info;
        if (req) {
            const url = req.protocol + '://' + req.headers.host + req.originalUrl;
            log.request = req.id;
            log.action = new URL(req.url, url).pathname;
            log.method = req.method;
            log.ip = getIp(req).clientIp;
            if (req.user) {
                log.user = {
                    id: req.user.id,
                    name: req.user[app.config.log.user.nameField]
                };
            }
            if (req.system) {
                log.system = {
                    id: req.system.id,
                    name: req.system[app.config.log.system.nameField]
                };
            }
        }
        if (obj) {
            log.content = this.removeInvalidKeys(obj);
        }
        log.time = new Date();
        try {
            await collection.insertOne(log);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
        return Promise.resolve();
    }
    static removeInvalidKeys(obj) {
        obj = Object.assign({}, obj);
        let key;
        for (key of Object.keys(obj)) {
            if (obj[key] instanceof Object) {
                obj[key] = this.removeInvalidKeys(obj[key]);
            }
            if (key.indexOf('.') > -1) {
                obj[key.replace(/\./g, '_')] = obj[key];
                delete obj[key];
            }
        }
        return obj;
    }
}
exports.default = Log;
