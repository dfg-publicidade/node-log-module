import App from '@dfgpublicidade/node-app-module';
import appDebugger from 'debug';
import { Request } from 'express';
import ipware from 'ipware';
import { Collection } from 'mongodb';

/* Module */
const debug: appDebugger.IDebugger = appDebugger('module:log');

class Log {
    public static async emit(app: App, req: Request, collectionName: string, obj?: any): Promise<any> {
        try {
            const collection: Collection = app.db.collection(collectionName);

            const getIp: (req: Request) => any = ipware().get_ip;

            const log: any = {};

            log.app = app.info;

            if (req) {
                log.request = req.id;
                log.action = req.url;
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

            let logData: string = `Logging into '${collectionName}'`;
            if (log.ip) {
                logData += ` from ${log.user ? log.user.name + '@' : ''}${log.ip}`;
            }
            if (log.method && log.action) {
                logData += ` at ${log.method}:${log.action}`;
            }

            debug(logData);

            if (obj) {
                log.content = this.removeInvalidKeys(obj);
            }

            log.time = new Date();

            await collection.insertOne(log);
        }
        catch (error: any) {
            // eslint-disable-next-line no-console
            console.error(error);
        }

        return Promise.resolve();
    }

    private static removeInvalidKeys(obj: any): any {
        obj = { ...obj };

        let key: string;
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

export default Log;
