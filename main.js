"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require("axios");
const Json2iob = require("./lib/json2iob");
class Micronova extends utils.Adapter {
  /**
   * @param {Partial<utils.AdapterOptions>} [options={}]
   */
  constructor(options) {
    super({
      ...options,
      name: "micronova",
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.deviceArray = [];
    this.deviceDict = {};

    this.json2iob = new Json2iob(this);
    this.requestClient = axios.create();
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    // Reset the connection indicator during startup
    this.setState("info.connection", false, true);
    if (this.config.interval < 0.5) {
      this.log.info("Set interval to minimum 0.5");
      this.config.interval = 0.5;
    }
    if (!this.config.username || !this.config.password) {
      this.log.error("Please set username and password in the instance settings");
      return;
    }

    this.updateInterval = null;
    this.reLoginTimeout = null;
    this.refreshTokenTimeout = null;
    this.session = {};
    this.subscribeStates("*");

    this.log.info("Login to Easy connect plus");
    await this.login();
    if (this.session.token) {
      await this.getDeviceList();
      await this.updateDevices();
      this.updateInterval = setInterval(async () => {
        await this.updateDevices();
      }, this.config.interval * 60 * 1000);
    }
    this.refreshTokenInterval = setInterval(() => {
      this.refreshToken();
    }, 12 * 60 * 60 * 1000);
  }
  async login() {
    await this.requestClient({
      method: "post",
      url: "https://remote.mcz.it/userLogin",
      headers: {
        Host: "remote.mcz.it",
        id_brand: "1",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Authorization: "6DFA47A6-1E78-44D8-A036-1363C171B3BB",
        "Accept-Language": "de-de",
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
        local: "true",
        customer_code: "746318",
      },
      data: { email: this.config.username, password: this.config.password },
    })
      .then((res) => {
        this.log.debug(JSON.stringify(res.data));
        if (res.data) {
          this.session = res.data;
          this.setState("info.connection", true, true);
        }
      })
      .catch((error) => {
        this.log.error(error);
        error.response && this.log.error(JSON.stringify(error.response.data));
      });
  }

  async getDeviceList() {
    await this.requestClient({
      method: "post",
      url: "https://remote.mcz.it/deviceList",
      headers: {
        Host: "remote.mcz.it",
        id_brand: "1",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Authorization: this.session.token,
        "Accept-Language": "de-de",
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
        local: "false",
        customer_code: "746318",
      },
      data: {},
    })
      .then(async (res) => {
        this.log.debug(JSON.stringify(res.data));
        if (res.data.device) {
          this.log.info(`Found ${res.data.device.length} devices`);
          for (const device of res.data.device) {
            this.log.debug(JSON.stringify(device));
            const id = device.id_device;
            this.deviceArray.push(device);
            this.deviceDict[id] = device;
            const name = device.name;

            await this.setObjectNotExistsAsync(id, {
              type: "device",
              common: {
                name: name,
              },
              native: {},
            });
            await this.setObjectNotExistsAsync(id + ".remote", {
              type: "channel",
              common: {
                name: "Remote Controls",
              },
              native: {},
            });

            const remoteArray = [
              { command: "Refresh", name: "True = Refresh" },
              {
                command: "setMethod",
                name: "Item/offset from register, Value from enc_val",
                def: "232,85",
                type: "string",
                role: "text",
              },
            ];
            remoteArray.forEach((remote) => {
              this.setObjectNotExists(id + ".remote." + remote.command, {
                type: "state",
                common: {
                  name: remote.name || "",
                  type: remote.type || "boolean",
                  role: remote.role || "boolean",
                  def: remote.def || false,
                  write: true,
                  read: true,
                },
                native: {},
              });
            });
            this.json2iob.parse(id + ".general", device, { forceIndex: true });
            await this.requestClient({
              method: "post",
              url: "https://remote.mcz.it/deviceGetRegistersMap",
              headers: {
                Host: "remote.mcz.it",
                id_brand: "1",
                Accept: "application/json, text/javascript, */*; q=0.01",
                Authorization: this.session.token,
                "Accept-Language": "de-de",
                "Content-Type": "application/json; charset=utf-8",
                "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
                local: "false",
                customer_code: "746318",
              },
              data: {
                id_product: device.id_product,
                id_device: device.id_device,
                last_update: null,
              },
            })
              .then(async (res) => {
                this.log.debug(JSON.stringify(res.data));
                if (!res.data) {
                  return;
                }

                let data = res.data.device_registers_map;
                if (data.registers_map) {
                  data = data.registers_map[0];
                }

                const forceIndex = true;
                const preferedArrayName = null;

                this.json2iob.parse(device.id_device + ".register", data, {
                  forceIndex: forceIndex,
                  write: true,
                  preferedArrayName: preferedArrayName,
                  channelName: "Register of device",
                });
              })
              .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
              });
          }
        }
      })
      .catch((error) => {
        this.log.error(error);
        error.response && this.log.error(JSON.stringify(error.response.data));
      });
  }

  async updateDevices() {
    for (const device of this.deviceArray) {
      // const url = element.url.replace("$id", id);

      await this.requestClient({
        method: "post",
        url: "https://remote.mcz.it/deviceGetBufferReading",
        headers: {
          Host: "remote.mcz.it",
          id_brand: "1",
          Accept: "application/json, text/javascript, */*; q=0.01",
          Authorization: this.session.token,
          "Accept-Language": "de-de",
          "Content-Type": "application/json; charset=utf-8",
          "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
          local: "false",
          customer_code: "746318",
        },
        data: {
          id_product: device.id_product,
          id_device: device.id_device,
          BufferId: 1,
        },
      })
        .then(async (res) => {
          this.log.debug(JSON.stringify(res.data));
          if (!res.data || res.data.Success === false) {
            this.log.error(JSON.stringify(res.data));
            return;
          }
          const idRequest = res.data.idRequest;
          let response = "";
          while (response === "") {
            await this.sleep(13000);
            this.log.debug("Waiting for response");
            response = await this.requestClient({
              method: "get",
              url: "https://remote.mcz.it/deviceJobStatus/" + idRequest,
              headers: {
                Host: "remote.mcz.it",
                "Content-Type": "application/json; charset=utf-8",
                "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
                local: "false",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "de-de",
                Authorization: this.session.token,
                customer_code: "746318",
                id_brand: "1",
              },
            })
              .then(async (res) => {
                this.log.debug(JSON.stringify(res.data));
                if (!res.data || res.data.Success === false) {
                  this.log.error(JSON.stringify(res.data));
                  return {};
                }

                if (res.data.jobAnswerStatus === "waiting") {
                  return "";
                }
                if (res.data.jobAnswerStatus !== "completed") {
                  return {};
                }
                const data = res.data.jobAnswerData;
                this.json2iob.parse(device.id_device + ".status", data, {
                  forceIndex: true,
                  write: true,
                  preferedArrayName: null,
                  channelName: "status of device",
                });
              })
              .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
              });
          }
        })
        .catch((error) => {
          if (error.response) {
            if (error.response.status === 401) {
              error.response && this.log.debug(JSON.stringify(error.response.data));
              this.log.info(" receive 401 error. Refresh Token in 60 seconds");
              this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
              this.refreshTokenTimeout = setTimeout(() => {
                this.refreshToken();
              }, 1000 * 60);

              return;
            }
          }

          this.log.error(error);
          error.response && this.log.error(JSON.stringify(error.response.data));
        });
    }
  }
  sleep(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
  async refreshToken() {
    this.log.debug("Refresh token");
    await this.login();
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   * @param {() => void} callback
   */
  onUnload(callback) {
    try {
      this.setState("info.connection", false, true);
      this.refreshTimeout && clearTimeout(this.refreshTimeout);
      this.reLoginTimeout && clearTimeout(this.reLoginTimeout);
      this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
      this.updateInterval && clearInterval(this.updateInterval);
      this.refreshTokenInterval && clearInterval(this.refreshTokenInterval);
      callback();
    } catch (e) {
      callback();
    }
  }

  /**
   * Is called if a subscribed state changes
   * @param {string} id
   * @param {ioBroker.State | null | undefined} state
   */
  async onStateChange(id, state) {
    if (state) {
      if (!state.ack) {
        const deviceId = id.split(".")[2];
        // const command = id.split(".")[4];

        const device = this.deviceDict[deviceId];
        if (id.split(".")[4] === "Refresh") {
          this.updateDevices();
          return;
        }
        if (!state.val) {
          this.log.info("Value is empty");
          return;
        }
        const values = state.val.replace(/ /g, "").split(",");
        if (values.length !== 2) {
          this.log.info("Value is not correct");
          return;
        }
        const data = {
          id_product: device.id_product,
          id_device: device.id_device,
          Protocol: "RWMSmaster",
          BitData: [8],
          Endianess: ["L"],
          Items: [parseInt(values[0])],
          Masks: [65535],
          Values: [parseInt(values[1])],
        };
        this.log.info(`Send data: ${JSON.stringify(data)}`);
        await this.requestClient({
          method: "post",
          url: "https://remote.mcz.it/deviceRequestWriting",
          headers: {
            Host: "remote.mcz.it",
            id_brand: "1",
            Accept: "application/json, text/javascript, */*; q=0.01",
            Authorization: this.session.token,
            "Accept-Language": "de-de",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Easy%20Connect%20Plus/1.9.1 CFNetwork/1240.0.4 Darwin/20.6.0",
            local: "false",
            customer_code: "746318",
          },
          data: data,
        })
          .then((res) => {
            this.log.info(JSON.stringify(res.data));
          })
          .catch(async (error) => {
            this.log.error(error);
            error.response && this.log.error(JSON.stringify(error.response.data));
          });
        this.refreshTimeout = setTimeout(async () => {
          this.log.info("Update devices");
          await this.updateDevices();
        }, 10 * 1000);
      } else {
        const resultDict = {
          auto_target_humidity: "setTargetHumidity",
          enabled: "setSwitch",
          display: "setDisplay",
          child_lock: "setChildLock",
          level: "setLevel-wind",
        };
        const idArray = id.split(".");
        const stateName = idArray[idArray.length - 1];
        const deviceId = id.split(".")[2];
        if (resultDict[stateName]) {
          const value = state.val;
          await this.setStateAsync(deviceId + ".remote." + resultDict[stateName], value, true);
        }
      }
    }
  }
}
if (require.main !== module) {
  // Export the constructor in compact mode
  /**
   * @param {Partial<utils.AdapterOptions>} [options={}]
   */
  module.exports = (options) => new Micronova(options);
} else {
  // otherwise start the instance directly
  new Micronova();
}
