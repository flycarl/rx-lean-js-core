import { IObjectState } from '../state/IObjectState';
import { IObjectController } from './IObjectController';
import { AVCommand } from '../../command/AVCommand';
import { IAVCommandRunner } from '../../command/IAVCommandRunner';
import { SDKPlugins } from '../../SDKPlugins';
import { Observable } from 'rxjs';

export class ObjectController implements IObjectController {
    private readonly _commandRunner: IAVCommandRunner;

    constructor(commandRunner: IAVCommandRunner) {
        this._commandRunner = commandRunner;
    }

    fetch(state: IObjectState, sessionToken: string): Observable<IObjectState> {
        let cmd = new AVCommand({
            app: state.app,
            relativeUrl: `/classes/${state.className}/${state.objectId}`,
            method: 'GET',
            data: null,
            sessionToken: sessionToken
        });
        return this._commandRunner.runRxCommand(cmd).map(res => {
            let serverState = SDKPlugins.instance.ObjectDecoder.decode(res.body, SDKPlugins.instance.Decoder);
            return serverState;
        });
    }
    delete(state: IObjectState, sessionToken: string): Observable<boolean> {
        let cmd = new AVCommand({
            app: state.app,
            relativeUrl: `/classes/${state.className}/${state.objectId}`,
            method: 'DELETE',
            data: null,
            sessionToken: sessionToken
        });
        return this._commandRunner.runRxCommand(cmd).map(res => {
            return res.satusCode == 200;
        });
    }
    batchDelete(states: Array<IObjectState>, sessionToken: string) {
        let cmdArray = states.map(state => {
            return new AVCommand({
                app: state.app,
                relativeUrl: `/classes/${state.className}/${state.objectId}`,
                method: 'DELETE',
                data: null,
                sessionToken: sessionToken
            })
        });
        return this.executeBatchCommands(cmdArray, sessionToken).map(batchRes => {
            return batchRes.map(res => {
                return res.satusCode == 200;
            });
        });
    }
    clearReadonlyFields(state: IObjectState, dictionary: { [key: string]: any }) {

        if (Object.prototype.hasOwnProperty.call(dictionary, 'objectId')) {
            delete dictionary['objectId'];
        }
        if (Object.prototype.hasOwnProperty.call(dictionary, 'createdAt')) {
            delete dictionary['createdAt'];
        }
        if (Object.prototype.hasOwnProperty.call(dictionary, 'updatedAt')) {
            delete dictionary['updatedAt'];
        }
        if (Object.prototype.hasOwnProperty.call(dictionary, 'className')) {
            delete dictionary['className'];
        }
        if (state.className == '_User') {
            if (Object.prototype.hasOwnProperty.call(dictionary, 'sessionToken')) {
                delete dictionary['sessionToken'];
            }
            if (Object.prototype.hasOwnProperty.call(dictionary, 'username')) {
                delete dictionary['username'];
            }
            if (Object.prototype.hasOwnProperty.call(dictionary, 'emailVerified')) {
                delete dictionary['emailVerified'];
            }
            if (Object.prototype.hasOwnProperty.call(dictionary, 'mobilePhoneVerified')) {
                delete dictionary['mobilePhoneVerified'];
            }
            if (Object.prototype.hasOwnProperty.call(dictionary, 'email')) {
                delete dictionary['email'];
            }
        }
    }

    clearRelationFields(state: IObjectState, dictionary: { [key: string]: any }) {
        for (let key in dictionary) {
            let v = dictionary[key];
            if (Object.prototype.hasOwnProperty.call(v, '__type')) {
                if (v['__type'] == 'Relation') {
                    delete dictionary[key];
                }
            }
        }
    }

    mergeOperations(state: IObjectState, dictionary: { [key: string]: any }) {
        for (let key in state.currentOperations) {
            dictionary[key] = state.currentOperations[key];
        }
    }

    copyToMutable(dictionary: { [key: string]: any }) {
        let newDictionary: { [key: string]: any } = {};
        for (let key in dictionary) {
            newDictionary[key] = dictionary[key];
        }
        return newDictionary;
    }

    packForSave(state: IObjectState, dictionary: { [key: string]: any }) {
        let mutableDictionary = this.copyToMutable(dictionary);
        this.clearReadonlyFields(state, mutableDictionary);
        this.clearRelationFields(state, mutableDictionary);
        this.mergeOperations(state, mutableDictionary);
        return mutableDictionary;
    }

    save(state: IObjectState, dictionary: { [key: string]: any }, sessionToken: string): Observable<IObjectState> {
        let mutableDictionary = this.packForSave(state, dictionary);
        let encoded = SDKPlugins.instance.Encoder.encode(mutableDictionary);
        let cmd = new AVCommand({
            app: state.app,
            relativeUrl: state.objectId == null ? `/classes/${state.className}` : `/classes/${state.className}/${state.objectId}`,
            method: state.objectId == null ? 'POST' : 'PUT',
            data: encoded,
            sessionToken: sessionToken
        });

        return this._commandRunner.runRxCommand(cmd).map(res => {
            let serverState = SDKPlugins.instance.ObjectDecoder.decode(res.body, SDKPlugins.instance.Decoder);
            state = state.mutatedClone(s => {
                s.isNew = res.satusCode == 201;
                if (serverState.updatedAt) {
                    s.updatedAt = serverState.updatedAt;
                }
                if (serverState.objectId) {
                    s.objectId = serverState.objectId;
                }
                if (serverState.createdAt) {
                    s.createdAt = serverState.createdAt;
                }
            });
            return state;
        });
    }

    batchSave(states: Array<IObjectState>, dictionaries: Array<{ [key: string]: any }>, sessionToken: string): Observable<Array<IObjectState>> {

        let cmdArray: Array<AVCommand> = [];

        states.map((state, i, a) => {
            let mutableDictionary = this.packForSave(states[i], dictionaries[i]);
            let encoded = SDKPlugins.instance.Encoder.encode(mutableDictionary);
            let cmd = new AVCommand({
                app: state.app,
                relativeUrl: state.objectId == null ? `/1.1/classes/${state.className}` : `/1.1/classes/${state.className}/${state.objectId}`,
                method: state.objectId == null ? 'POST' : 'PUT',
                data: encoded,
                sessionToken: sessionToken
            });

            cmdArray.push(cmd);
        });

        return this.executeBatchCommands(cmdArray, sessionToken).map(batchRes => {
            return batchRes.map(res => {
                let serverState = SDKPlugins.instance.ObjectDecoder.decode(res, SDKPlugins.instance.Decoder);
                serverState = serverState.mutatedClone((s: IObjectState) => {
                    s.isNew = res['satusCode'] == 201;
                });
                return serverState;
            });
        });

    }
    executeBatchCommands(requests: Array<AVCommand>, sessionToken: string) {
        let rtn: Array<{ [key: string]: any }> = [];
        let batchSize = requests.length;
        let encodedRequests = requests.map((cmd, i, a) => {
            let r: { [key: string]: any } = {
                method: cmd.method,
                path: cmd.relativeUrl
            };
            if (cmd.data != null) {
                r['body'] = cmd.data;
            }
            return r;
        });

        let batchRequest = new AVCommand({
            relativeUrl: '/batch',
            method: 'POST',
            data: { requests: encodedRequests },
            sessionToken: sessionToken
        });
        return this._commandRunner.runRxCommand(batchRequest).map(res => {
            let resultsArray = res.body;
            let resultLength = resultsArray.length;
            if (resultLength != batchSize) {
                throw new Error(`Batch command result count expected: " + ${batchSize} + " but was: " + ${resultLength} + ".`)
            }
            for (let i = 0; i < batchSize; i++) {
                let result = resultsArray[i];
                if (Object.prototype.hasOwnProperty.call(result, 'success')) {
                    let subBody = result.success;
                    rtn.push(subBody);
                }
            }
            return rtn;
        });
    }
}