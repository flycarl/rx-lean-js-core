import { IObjectState } from '../object/state/IObjectState';
import { MutableObjectState } from '../object/state/MutableObjectState';
import { IAVObjectDecoder } from './IAVObjectDecoder';
import { IAVDecoder } from './IAVDecoder';
import { RxAVObject } from '../../RxLeanCloud';

export /**
 * AVDecoder
 */
    class AVObjectDecoder implements IAVObjectDecoder {
    constructor() {
    }

    decode(serverResult: any, decoder: IAVDecoder): IObjectState {
        let state = new MutableObjectState();
        this.handlerServerResult(state, serverResult, decoder);
        return state;
    }

    handlerServerResult(state: MutableObjectState, serverResult: any, decoder: IAVDecoder): IObjectState {
        let mutableData: { [key: string]: any } = {};
        if (serverResult.createdAt) {
            state.createdAt = serverResult.createdAt;
            state.updatedAt = serverResult.createdAt;
            delete serverResult.createdAt;
        }
        if (serverResult.updatedAt) {
            state.updatedAt = serverResult.updatedAt;
            delete serverResult.updatedAt;
        }
        if (serverResult.objectId) {
            state.objectId = serverResult.objectId;
            delete serverResult.objectId;
        }

        for (let key in serverResult) {

            var value = serverResult[key];
            
            if (value != null) {
                if (Object.prototype.hasOwnProperty.call(value, '__type') || Object.prototype.hasOwnProperty.call(value, 'className')) {
                    if (value['__type'] == 'Pointer') {
                        let rxAVObject: RxAVObject = decoder.decodeItem(value);
                        delete value.__type;
                        let serverState = this.decode(value, decoder);
                        rxAVObject.handleFetchResult(serverState);
                        mutableData[key] = rxAVObject;
                    } else {
                        mutableData[key] = decoder.decodeItem(value);
                    }
                } else if (Array.isArray(value)) {
                    mutableData[key] = decoder.decodeItem(value);
                } else {
                    mutableData[key] = value;
                }
            }
        }
        state.serverData = mutableData;
        state.isNew = true;
        return state;
    }
}