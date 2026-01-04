import {
  __commonJS
} from "./chunk-TWWAJFRB.js";

// node_modules/paychangu-js/dist/core/constants.js
var require_constants = __commonJS({
  "node_modules/paychangu-js/dist/core/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PAYCHANGU_SCRIPT_URL = void 0;
    exports.PAYCHANGU_SCRIPT_URL = "https://in.paychangu.com/js/popup.js";
  }
});

// node_modules/paychangu-js/dist/core/config.js
var require_config = __commonJS({
  "node_modules/paychangu-js/dist/core/config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getConfig = exports.setConfig = void 0;
    var config = null;
    function setConfig(newConfig) {
      config = newConfig;
    }
    exports.setConfig = setConfig;
    function getConfig() {
      return config;
    }
    exports.getConfig = getConfig;
  }
});

// node_modules/paychangu-js/dist/utils/errors.js
var require_errors = __commonJS({
  "node_modules/paychangu-js/dist/utils/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PaychanguError = void 0;
    var PaychanguError = class extends Error {
      constructor(message, details) {
        super(message);
        this.details = details;
        this.name = "PaychanguError";
      }
    };
    exports.PaychanguError = PaychanguError;
  }
});

// node_modules/paychangu-js/dist/utils/validation.js
var require_validation = __commonJS({
  "node_modules/paychangu-js/dist/utils/validation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.validateLevelConfig = exports.validateConfig = void 0;
    var errors_1 = require_errors();
    function validateConfig(config) {
      const requiredFields = ["public_key", "tx_ref", "amount", "currency", "callback_url", "return_url", "customer", "customization"];
      for (const field of requiredFields) {
        if (!(field in config)) {
          throw new errors_1.PaychanguError(`Missing required field: ${field}`);
        }
      }
      if (typeof config.amount !== "number" || config.amount <= 0) {
        throw new errors_1.PaychanguError("Amount must be a positive number");
      }
      if (!config.customer.email || !config.customer.first_name || !config.customer.last_name) {
        throw new errors_1.PaychanguError("Customer information is incomplete");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.customer.email)) {
        throw new errors_1.PaychanguError("Invalid email format");
      }
      if (!/^[A-Z]{3}$/.test(config.currency)) {
        throw new errors_1.PaychanguError("Currency must be a 3-letter ISO code");
      }
    }
    exports.validateConfig = validateConfig;
    function validateLevelConfig(config) {
      const requiredFields = ["amount", "currency", "email", "first_name", "last_name", "callback_url", "return_url", "tx_ref"];
      for (const field of requiredFields) {
        if (!(field in config)) {
          throw new errors_1.PaychanguError(`Missing required field: ${field}`);
        }
      }
      if (typeof config.amount !== "number" || config.amount <= 0) {
        throw new errors_1.PaychanguError("Amount must be a positive number");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
        throw new errors_1.PaychanguError("Invalid email format");
      }
      if (!/^[A-Z]{3}$/.test(config.currency)) {
        throw new errors_1.PaychanguError("Currency must be a 3-letter ISO code");
      }
    }
    exports.validateLevelConfig = validateLevelConfig;
  }
});

// node_modules/paychangu-js/dist/utils/helpers.js
var require_helpers = __commonJS({
  "node_modules/paychangu-js/dist/utils/helpers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.debounce = exports.retry = exports.validateUrl = exports.formatAmount = exports.generateTxRef = void 0;
    function generateTxRef() {
      return "TX" + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    exports.generateTxRef = generateTxRef;
    function formatAmount(amount) {
      return amount.toFixed(2);
    }
    exports.formatAmount = formatAmount;
    function validateUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (_a) {
        return false;
      }
    }
    exports.validateUrl = validateUrl;
    function retry(fn, maxRetries = 3, delay = 1e3) {
      return fn().catch((error) => {
        if (maxRetries === 0) {
          throw error;
        }
        return new Promise((resolve) => setTimeout(resolve, delay)).then(() => retry(fn, maxRetries - 1, delay));
      });
    }
    exports.retry = retry;
    function debounce(func, waitFor) {
      let timeout = null;
      return (...args) => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
      };
    }
    exports.debounce = debounce;
  }
});

// node_modules/paychangu-js/dist/services/popup.js
var require_popup = __commonJS({
  "node_modules/paychangu-js/dist/services/popup.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PaychanguPopup = void 0;
    var constants_1 = require_constants();
    var config_1 = require_config();
    var validation_1 = require_validation();
    var errors_1 = require_errors();
    var helpers_1 = require_helpers();
    var PaychanguPopup = class _PaychanguPopup {
      constructor() {
        this.scriptLoaded = false;
        this.loadScript();
      }
      static getInstance() {
        if (!_PaychanguPopup.instance) {
          _PaychanguPopup.instance = new _PaychanguPopup();
        }
        return _PaychanguPopup.instance;
      }
      loadScript() {
        if (!document.querySelector(`script[src="${constants_1.PAYCHANGU_SCRIPT_URL}"]`)) {
          const script = document.createElement("script");
          script.src = constants_1.PAYCHANGU_SCRIPT_URL;
          script.async = true;
          script.onload = () => {
            this.scriptLoaded = true;
          };
          script.onerror = () => {
            throw new errors_1.PaychanguError("Failed to load Paychangu script");
          };
          document.body.appendChild(script);
        }
      }
      initialize(config) {
        try {
          (0, validation_1.validateConfig)(config);
          if (!(0, helpers_1.validateUrl)(config.callback_url) || !(0, helpers_1.validateUrl)(config.return_url)) {
            throw new errors_1.PaychanguError("Invalid URL format for callback_url or return_url");
          }
          (0, config_1.setConfig)(config);
        } catch (error) {
          if (error instanceof errors_1.PaychanguError) {
            console.error("Paychangu initialization error:", error.message);
          }
          throw error;
        }
      }
      makePayment() {
        return __awaiter(this, void 0, void 0, function* () {
          const config = (0, config_1.getConfig)();
          if (!config) {
            throw new errors_1.PaychanguError("PaychanguPopup not initialized. Call initialize() first.");
          }
          if (!this.scriptLoaded) {
            throw new errors_1.PaychanguError("PaychanguCheckout script is still loading. Please wait.");
          }
          return (0, helpers_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
            if (typeof window.PaychanguCheckout !== "function") {
              throw new errors_1.PaychanguError("PaychanguCheckout not loaded. Please wait for the script to load.");
            }
            window.PaychanguCheckout(config);
          }), 5, 500);
        });
      }
    };
    exports.PaychanguPopup = PaychanguPopup;
  }
});

// node_modules/paychangu-js/dist/services/level.js
var require_level = __commonJS({
  "node_modules/paychangu-js/dist/services/level.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.LevelAPI = void 0;
    var errors_1 = require_errors();
    var validation_1 = require_validation();
    var helpers_1 = require_helpers();
    var LevelAPI = class _LevelAPI {
      constructor() {
        this.secretKey = null;
      }
      static getInstance() {
        if (!_LevelAPI.instance) {
          _LevelAPI.instance = new _LevelAPI();
        }
        return _LevelAPI.instance;
      }
      setSecretKey(secretKey) {
        this.secretKey = secretKey;
      }
      initiateTransaction(config) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.secretKey) {
            throw new errors_1.PaychanguError("Secret key not set. Call setSecretKey() first.");
          }
          (0, validation_1.validateLevelConfig)(config);
          return (0, helpers_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
            try {
              const response = yield fetch("https://api.paychangu.com/payment", {
                method: "POST",
                headers: {
                  "Accept": "application/json",
                  "Authorization": `Bearer ${this.secretKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(config)
              });
              if (!response.ok) {
                throw new errors_1.PaychanguError(`HTTP error! status: ${response.status}`);
              }
              const data = yield response.json();
              return data;
            } catch (error) {
              if (error instanceof errors_1.PaychanguError) {
                throw error;
              }
              throw new errors_1.PaychanguError("Failed to initiate transaction", {
                cause: error
              });
            }
          }), 3, 1e3);
        });
      }
    };
    exports.LevelAPI = LevelAPI;
  }
});

// node_modules/paychangu-js/dist/services/verification.js
var require_verification = __commonJS({
  "node_modules/paychangu-js/dist/services/verification.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VerificationAPI = void 0;
    var errors_1 = require_errors();
    var helpers_1 = require_helpers();
    var VerificationAPI = class _VerificationAPI {
      constructor() {
        this.secretKey = null;
      }
      static getInstance() {
        if (!_VerificationAPI.instance) {
          _VerificationAPI.instance = new _VerificationAPI();
        }
        return _VerificationAPI.instance;
      }
      setSecretKey(secretKey) {
        this.secretKey = secretKey;
      }
      verifyTransaction(txRef) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.secretKey) {
            throw new errors_1.PaychanguError("Secret key not set. Call setSecretKey() first.");
          }
          return (0, helpers_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
            try {
              const response = yield fetch(`https://api.paychangu.com/verify-payment/${txRef}`, {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                  "Authorization": `Bearer ${this.secretKey}`
                }
              });
              if (!response.ok) {
                throw new errors_1.PaychanguError(`HTTP error! status: ${response.status}`);
              }
              const data = yield response.json();
              return data;
            } catch (error) {
              if (error instanceof errors_1.PaychanguError) {
                throw error;
              }
              throw new errors_1.PaychanguError("Failed to verify transaction", {
                cause: error
              });
            }
          }), 3, 1e3);
        });
      }
    };
    exports.VerificationAPI = VerificationAPI;
  }
});

// node_modules/paychangu-js/dist/index.js
var require_dist = __commonJS({
  "node_modules/paychangu-js/dist/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VerificationSDK = exports.LevelSDK = exports.PopupSDK = exports.generateTxRef = void 0;
    var popup_1 = require_popup();
    var level_1 = require_level();
    var verification_1 = require_verification();
    var helpers_1 = require_helpers();
    Object.defineProperty(exports, "generateTxRef", {
      enumerable: true,
      get: function() {
        return helpers_1.generateTxRef;
      }
    });
    exports.PopupSDK = popup_1.PaychanguPopup.getInstance();
    exports.LevelSDK = level_1.LevelAPI.getInstance();
    exports.VerificationSDK = verification_1.VerificationAPI.getInstance();
  }
});
export default require_dist();
//# sourceMappingURL=paychangu-js.js.map
