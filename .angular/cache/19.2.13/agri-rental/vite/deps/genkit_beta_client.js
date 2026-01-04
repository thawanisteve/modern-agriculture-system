import {
  __async,
  __commonJS,
  __spreadValues,
  __toESM
} from "./chunk-TWWAJFRB.js";

// node_modules/@genkit-ai/core/lib/async.js
var require_async = __commonJS({
  "node_modules/@genkit-ai/core/lib/async.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all) __defProp(target, name, {
        get: all[name],
        enumerable: true
      });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", {
      value: true
    }), mod);
    var async_exports = {};
    __export(async_exports, {
      Channel: () => Channel,
      LazyPromise: () => LazyPromise,
      lazy: () => lazy
    });
    module.exports = __toCommonJS(async_exports);
    function createTask() {
      let resolve, reject;
      let promise = new Promise((res, rej) => [resolve, reject] = [res, rej]);
      return {
        resolve,
        reject,
        promise
      };
    }
    var Channel = class {
      ready = createTask();
      buffer = [];
      err = null;
      send(value) {
        this.buffer.push(value);
        this.ready.resolve();
      }
      close() {
        this.buffer.push(null);
        this.ready.resolve();
      }
      error(err) {
        this.err = err;
        this.ready.reject(err);
      }
      [Symbol.asyncIterator]() {
        return {
          next: () => __async(this, null, function* () {
            if (this.err) {
              throw this.err;
            }
            if (!this.buffer.length) {
              yield this.ready.promise;
            }
            const value = this.buffer.shift();
            if (!this.buffer.length) {
              this.ready = createTask();
            }
            return {
              value,
              done: !value
            };
          })
        };
      }
    };
    var LazyPromise = class {
      executor;
      promise;
      constructor(executor) {
        this.executor = executor;
      }
      then(onfulfilled, onrejected) {
        this.promise ??= new Promise(this.executor);
        return this.promise.then(onfulfilled, onrejected);
      }
    };
    function lazy(fn) {
      return new LazyPromise((resolve, reject) => {
        try {
          resolve(fn());
        } catch (e) {
          reject(e);
        }
      });
    }
  }
});

// node_modules/genkit/lib/client/client.js
var require_client = __commonJS({
  "node_modules/genkit/lib/client/client.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all) __defProp(target, name, {
        get: all[name],
        enumerable: true
      });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", {
      value: true
    }), mod);
    var client_exports = {};
    __export(client_exports, {
      runFlow: () => runFlow2,
      streamFlow: () => streamFlow2
    });
    module.exports = __toCommonJS(client_exports);
    var import_async = require_async();
    var __flowStreamDelimiter = "\n\n";
    function streamFlow2({
      url,
      input,
      headers
    }) {
      const channel = new import_async.Channel();
      const operationPromise = __flowRunEnvelope({
        url,
        input,
        sendChunk: (c) => channel.send(c),
        headers
      });
      operationPromise.then(() => channel.close(), (err) => channel.error(err));
      return {
        output: operationPromise,
        stream: channel
      };
    }
    function __flowRunEnvelope(_0) {
      return __async(this, arguments, function* ({
        url,
        input,
        sendChunk,
        headers
      }) {
        const response = yield fetch(url, {
          method: "POST",
          body: JSON.stringify({
            data: input
          }),
          headers: __spreadValues({
            Accept: "text/event-stream",
            "Content-Type": "application/json"
          }, headers)
        });
        if (response.status !== 200) {
          throw new Error(`Server returned: ${response.status}: ${yield response.text()}`);
        }
        if (!response.body) {
          throw new Error("Response body is empty");
        }
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const result = yield reader.read();
          const decodedValue = decoder.decode(result.value);
          if (decodedValue) {
            buffer += decodedValue;
          }
          while (buffer.includes(__flowStreamDelimiter)) {
            const chunk = JSON.parse(buffer.substring(0, buffer.indexOf(__flowStreamDelimiter)).substring("data: ".length));
            if (chunk.hasOwnProperty("message")) {
              sendChunk(chunk.message);
            } else if (chunk.hasOwnProperty("result")) {
              return chunk.result;
            } else if (chunk.hasOwnProperty("error")) {
              throw new Error(`${chunk.error.status}: ${chunk.error.message}
${chunk.error.details}`);
            } else {
              throw new Error("unkown chunk format: " + JSON.stringify(chunk));
            }
            buffer = buffer.substring(buffer.indexOf(__flowStreamDelimiter) + __flowStreamDelimiter.length);
          }
        }
        throw new Error("stream did not terminate correctly");
      });
    }
    function runFlow2(_0) {
      return __async(this, arguments, function* ({
        url,
        input,
        headers
      }) {
        const response = yield fetch(url, {
          method: "POST",
          body: JSON.stringify({
            data: input
          }),
          headers: __spreadValues({
            "Content-Type": "application/json"
          }, headers)
        });
        if (response.status !== 200) {
          throw new Error(`Server returned: ${response.status}: ${yield response.text()}`);
        }
        const wrappedResult = yield response.json();
        if ("error" in wrappedResult) {
          if (typeof wrappedResult.error === "string") {
            throw new Error(wrappedResult.error);
          }
          throw new Error(JSON.stringify(wrappedResult.error));
        }
        return wrappedResult.result;
      });
    }
  }
});

// node_modules/genkit/lib/client/index.mjs
var import_client = __toESM(require_client(), 1);
var export_runFlow = import_client.runFlow;
var export_streamFlow = import_client.streamFlow;
export {
  export_runFlow as runFlow,
  export_streamFlow as streamFlow
};
/*! Bundled license information:

genkit/lib/client/index.mjs:
  (**
   * @license
   *
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
//# sourceMappingURL=genkit_beta_client.js.map
