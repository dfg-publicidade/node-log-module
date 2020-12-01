import App from '@dfgpublicidade/node-app-module';
import { Request } from 'express';
declare class Log {
    static emit(app: App, req: Request, collectionName: string, obj?: any): Promise<any>;
    private static removeInvalidKeys;
}
export default Log;
