"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require("axios").default;
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
    this.ids = {
      eva: { name: "EvaCalòr - PuntoFuoco", id: "635987", url: "https://evastampaggi.agua-iot.com" },
      elfi: { name: "Elfire Wifi", id: "402762", url: "https://elfire.agua-iot.com" },
      karm: { name: "Karmek Wifi", id: "403873", url: "https://karmekone.agua-iot.com" },
      easy: { name: "Easy Connect", id: "354924", url: "https://remote.mcz.it" },
      easyplus: { name: "Easy Connect Plus", id: "746318", url: "https://remote.mcz.it" },
      easypoel: { name: "Easy Connect Poêle", id: "354925", url: "https://remote.mcz.it" },
      lor: { name: "Lorflam Home", id: "121567", url: "https://lorflam.agua-iot.com" },
      lmx: { name: "LMX Remote Control", id: "352678", url: "https://laminox.agua-iot.com" },
      bor: { name: "Boreal Home", id: "173118", url: "https://boreal.agua-iot.com" },
      bron: { name: "Bronpi Home", id: "164873", url: "https://bronpi.agua-iot.com" },
      eoss: { name: "EOSS WIFI", id: "326495", url: "https://solartecnik.agua-iot.com" },
      lami: { name: "LAMINOXREM REMOTE CONTROL 2.0", id: "352678", url: "https://laminox.agua-iot.com" },
      jolly: { name: "Jolly Mec Wi Fi", id: "732584", url: "https://jollymec.agua-iot.com" },
      globe: { name: "Globe-fire", id: "634876", url: "https://globefire.agua-iot.com" },
      ts: { name: "TS Smart", id: "046629", url: "https://timsistem.agua-iot.com" },
      stuf: { name: "Stufe a pellet Italia", id: "015142", url: "https://stufepelletitalia.agua-iot.com" },
      my: { name: "My Corisit", id: "101427", url: "https://mycorisit.agua-iot.com" },
      font: { name: "Fonte Flamme contrôle 1", id: "848324", url: "https://fonteflame.agua-iot.com" },
      klov: { name: "Klover Home", id: "143789", url: "https://klover.agua-iot.com" },
      nord: { name: "Nordic Fire 2.0", id: "132678", url: "https://nordicfire.agua-iot.com" },
      go: { name: "GO HEAT", id: "859435", url: "https://amg.agua-iot.com" },
      wip: { name: "Wi-Phire", id: "521228", url: "https://lineavz.agua-iot.com" },
      ther: { name: "Thermoflux", id: "391278", url: "https://thermoflux.agua-iot.com" },
      dar: { name: "Darwin Evolution", id: "475219", url: "https://cola.agua-iot.com" },
      mor: { name: "Moretti design", id: "624813", url: "https://moretti.agua-iot.com" },
      fon: { name: "Fontana Forni", id: "505912", url: "https://fontanaforni.agua-iot.com" },
      myp: { name: "MyPiazzetta (MySuperior?)", id: "458632", url: "https://piazzetta.agua-iot.com" },
      alf: { name: "Alfaplam", id: "862148", url: "https://alfaplam.agua-iot.com" },
      nin: { name: "Nina", id: "999999", url: "https://micronova.agua-iot.com" },
    };
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
    if (!this.config.type) {
      this.log.error("Please set app in the instance settings");
      return;
    }

    this.updateInterval = null;
    this.reLoginTimeout = null;
    this.refreshTokenTimeout = null;
    this.session = {};
    this.subscribeStates("*");

    this.log.info("Login to " + this.ids[this.config.type].name);
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
      url: this.ids[this.config.type].url + "/userLogin",
      headers: {
        id_brand: "1",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Authorization: "6DFA47A6-1E78-44D8-A036-1363C171B3BB",
        "Accept-Language": "de-de",
        "Content-Type": "application/json; charset=utf-8",
        local: "true",
        customer_code: this.ids[this.config.type].id,
      },
      data: { email: this.config.username, password: this.config.password },
    })
      .then((res) => {
        this.log.debug(JSON.stringify(res.data));
        if (res.data) {
          this.session = res.data;
          this.log.info("Login successful");
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
      url: this.ids[this.config.type].url + "/deviceList",
      headers: {
        id_brand: "1",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Authorization: this.session.token,
        "Accept-Language": "de-de",
        "Content-Type": "application/json; charset=utf-8",
        local: "false",
        customer_code: this.ids[this.config.type].id,
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
              url: this.ids[this.config.type].url + "/deviceGetRegistersMap",
              headers: {
                id_brand: "1",
                Accept: "application/json, text/javascript, */*; q=0.01",
                Authorization: this.session.token,
                "Accept-Language": "de-de",
                "Content-Type": "application/json; charset=utf-8",
                local: "false",
                customer_code: this.ids[this.config.type].id,
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

                const forceIndex = false;
                const preferedArrayName = "offset";
                const preferedArrayDesc = "reg_key";

                this.json2iob.parse(device.id_device + ".register", data, {
                  forceIndex: forceIndex,
                  write: true,
                  preferedArrayDesc: preferedArrayDesc,
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
        url: this.ids[this.config.type].url + "/deviceGetBufferReading",
        headers: {
          id_brand: "1",
          Accept: "application/json, text/javascript, */*; q=0.01",
          Authorization: this.session.token,
          "Accept-Language": "de-de",
          "Content-Type": "application/json; charset=utf-8",
          local: "false",
          customer_code: this.ids[this.config.type].id,
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
              url: this.ids[this.config.type].url + "/deviceJobStatus/" + idRequest,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                local: "false",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "de-de",
                Authorization: this.session.token,
                customer_code: this.ids[this.config.type].id,
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
              this.log.info(" receive 401 error. Refresh Token in 30 seconds");
              this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
              this.refreshTokenTimeout = setTimeout(async () => {
                await this.refreshToken();
              }, 1000 * 30);

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
    // await this.requestClient({
    //   method: "post",
    //   url: this.ids[this.config.type].url + "/refreshToken",
    //   headers: {
    //     id_brand: "1",
    //     Accept: "application/json, text/javascript, */*; q=0.01",
    //     Authorization: this.session.token,
    //     "Accept-Language": "de-de",
    //     "Content-Type": "application/json; charset=utf-8",
    //     local: "true",
    //     customer_code: this.ids[this.config.type].id,
    //   },
    //   data: { refresh_token: this.session.refresh_token },
    // })
    //   .then((res) => {
    //     this.log.debug(JSON.stringify(res.data));
    //     if (res.data) {
    //       this.log.debug(`Refresh token success`);
    //       this.session.token = res.data.token;
    //       this.setState("info.connection", true, true);
    //     }
    //   })
    //   .catch((error) => {
    //     this.log.error(error);
    //     error.response && this.log.error(JSON.stringify(error.response.data));
    //   });
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
          url: this.ids[this.config.type].url + "/deviceRequestWriting",
          headers: {
            id_brand: "1",
            Accept: "application/json, text/javascript, */*; q=0.01",
            Authorization: this.session.token,
            "Accept-Language": "de-de",
            "Content-Type": "application/json; charset=utf-8",
            local: "false",
            customer_code: this.ids[this.config.type].id,
          },
          data: data,
        })
          .then((res) => {
            this.log.info(JSON.stringify(res.data));
          })
          .catch((error) => {
            if (error.response) {
              if (error.response.status === 401) {
                error.response && this.log.debug(JSON.stringify(error.response.data));
                this.log.info(" receive 401 error. Refresh Token in 60 seconds");
                this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
                this.refreshTokenTimeout = setTimeout(async () => {
                  await this.refreshToken();
                  this.setState(id, state.val, false);
                }, 1000 * 60);

                return;
              }
            }

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
