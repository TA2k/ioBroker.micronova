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
    this.desc = {
      accensioni_get: "Zündungen",
      alarms_get: "Alarms",
      allarme_desc_get: "Alarms",
      calendar_day_set: "Tag",
      calendar_day_week_set: "Tag einstellen",
      calendar_month_set: "Monat",
      calendar_year_set: "Jahr",
      canalization_1_2_vent_set: "Belüftung",
      canalization_1_2_verso_set: "Kanalisierung",
      canalization_1_enable: "Channeling 1",
      canalization_1_lock_set: "Kanalisiert DX",
      canalization_1_max: "Kann. 1 max",
      canalization_1_min: "Kann. 1 min",
      canalization_1_set: "Kanalisiert DX",
      canalization_1_temp_air_enable: "Kann. 1 Temp.",
      canalization_1_temp_air_get: "Kann. DX T. Luft",
      canalization_1_temp_air_max: "Kann. 1 T. Luft max",
      canalization_1_temp_air_min: "Kann. 1 T. airmin",
      canalization_1_temp_air_set: "Kann. DX T. Luftmenge",
      canalization_2_enable: "Kanalisieren 2",
      canalization_2_lock_set: "Kanalisiert SX",
      canalization_2_max: "Kann. 2 max",
      canalization_2_min: "Kann. 2 min",
      canalization_2_set: "Kanalisiert SX",
      canalization_2_temp_air_enable: "Kann. 2 Temp.",
      canalization_2_temp_air_get: "Kann. SX T. Luft",
      canalization_2_temp_air_max: "Kann. 2 T. Luft max",
      canalization_2_temp_air_min: "Kann. 2 T. Luftmin",
      canalization_2_temp_air_set: "Kann. SX T. Luftmenge",
      canalization_2dx_get: "Kanalisiert RR",
      canalization_2dx_set: "Kanalisiert RR",
      canalization_2dx_temp_air_get: "Kann. RR T. Luft",
      canalization_2dx_temp_air_set: "Kann. RR T. Luftmenge",
      canalization_2sx_get: "Kanalisiert RL",
      canalization_2sx_set: "Kanalisiert RL",
      canalization_2sx_temp_air_get: "Kann. RL T. Luft",
      canalization_2sx_temp_air_set: "Kann. RL T. Luftmenge",
      canalization_dx_get: "Kanalisiert RR",
      canalization_dx_set: "Kanalisiert RR",
      canalization_dx_temp_air_get: "Kann. RR T. Luft",
      canalization_dx_temp_air_set: "Kann. RR T. Luftmenge",
      canalization_man_auto_set: "Kann. Mann / Auto",
      canalization_single_lock_set: "Kanalisiert",
      canalization_single_set: "Kanalisiert",
      canalization_single_temp_air_get: "T. Kanalisiert",
      canalization_single_temp_air_set: "Kan.snelh.",
      canalization_single_vent_set: "Belüftung",
      canalization_sx_get: "Kanalisiert RL",
      canalization_sx_set: "Kanalisiert RL",
      canalization_sx_temp_air_get: "Kann. RL T. Luft",
      canalization_sx_temp_air_set: "Kann. RL T. Luftmenge",
      chrono_general_enable_set: "Aktivieren Sie den Timer",
      chrono_p1_canl_set: "Belüftung Can. L.",
      chrono_p1_canr_set: "Belüftung Can. R.",
      chrono_p1_day_friday_set: "Einschalten. Freitag P1",
      chrono_p1_day_monday_set: "Einschalten. Montag P1",
      chrono_p1_day_saturday_set: "Einschalten. Samstag P1",
      chrono_p1_day_sunday_set: "Einschalten. Sonntag P1",
      chrono_p1_day_thursday_set: "Einschalten. Donnerstag P1",
      chrono_p1_day_tuesday_set: "Einschalten. Dienstag P1",
      chrono_p1_day_wednesday_set: "Einschalten. Mittwoch P1",
      chrono_p1_enable_set: "Einschalten. P1",
      chrono_p1_fan_front_enable: "Belüftung F.",
      chrono_p1_fan_rear_set: "Belüftung R.",
      chrono_p1_fan_set: "Belüftung einstellen",
      chrono_p1_multifire_1_set: "Multifuoco 1 P1",
      chrono_p1_multifire_2_set: "Multifuoco 2 P1",
      chrono_p1_power_set: "Stellen Sie die Leistung P1 ein",
      chrono_p1_start_set: "Schalte P1 ein",
      chrono_p1_stop_set: "Schalten Sie P1 aus",
      chrono_p1_t_rear_set: "Temperatur R.",
      chrono_p1_tcanl_set: "Temperatur can. L.",
      chrono_p1_tcanr_set: "Temperatur can. R.",
      chrono_p1_temperature_set: "Temperatur",
      chrono_p1_temperature_water_set: "Temp. Wasser P1",
      chrono_p2_canl_set: "Belüftung Can. L.",
      chrono_p2_canr_set: "Belüftung Can. R.",
      chrono_p2_day_friday_set: "Einschalten. Freitag P2",
      chrono_p2_day_monday_set: "Einschalten. Montag P2",
      chrono_p2_day_saturday_set: "Einschalten. Samstag P2",
      chrono_p2_day_sunday_set: "Einschalten. Sonntag P2",
      chrono_p2_day_thursday_set: "Einschalten. Donnerstag P2",
      chrono_p2_day_tuesday_set: "Einschalten. Dienstag P2",
      chrono_p2_day_wednesday_set: "Einschalten. Mittwoch P2",
      chrono_p2_enable_set: "Einschalten. P2",
      chrono_p2_fan_front_enable: "Belüftung F.",
      chrono_p2_fan_rear_set: "Belüftung R.",
      chrono_p2_fan_set: "Stellen Sie P2 Belüftung ein",
      chrono_p2_multifire_1_set: "Multifuoco 1 P2",
      chrono_p2_multifire_2_set: "Multifuoco 2 P2",
      chrono_p2_power_set: "Stellen Sie P2 ein",
      chrono_p2_start_set: "Ernährung auf P2",
      chrono_p2_stop_set: "Schalten Sie P2 aus",
      chrono_p2_t_rear_set: "Temperatur R.",
      chrono_p2_tcanl_set: "Temperatur can. L.",
      chrono_p2_tcanr_set: "Temperatur can. R.",
      chrono_p2_temperature_set: "Lufttemperatur P2",
      chrono_p2_temperature_water_set: "Wassertemperatur P2",
      chrono_p3_canl_set: "Belüftung Can. L.",
      chrono_p3_canr_set: "Belüftung Can. R.",
      chrono_p3_day_friday_set: "Einschalten. Freitag P3",
      chrono_p3_day_monday_set: "Einschalten. Montag P3",
      chrono_p3_day_saturday_set: "Einschalten. Samstag P3",
      chrono_p3_day_sunday_set: "Einschalten. Sonntag P3",
      chrono_p3_day_thursday_set: "Einschalten. Donnerstag P3",
      chrono_p3_day_tuesday_set: "Einschalten. Dienstag P3",
      chrono_p3_day_wednesday_set: "Einschalten. Mittwoch P3",
      chrono_p3_enable_set: "Einschalten. P3",
      chrono_p3_fan_front_enable: "Belüftung F.",
      chrono_p3_fan_rear_set: "Belüftung R.",
      chrono_p3_fan_set: "Set P3 Belüftung",
      chrono_p3_multifire_1_set: "Multifuoco 1 P3",
      chrono_p3_multifire_2_set: "Multifuoco 2 P3",
      chrono_p3_power_set: "Stellen Sie die Leistung P3 ein",
      chrono_p3_start_set: "Schalten Sie P3 ein",
      chrono_p3_stop_set: "P3 ausschalten",
      chrono_p3_t_rear_set: "Temperatur R.",
      chrono_p3_tcanl_set: "Temperatur can. L.",
      chrono_p3_tcanr_set: "Temperatur can. R.",
      chrono_p3_temperature_set: "Lufttemperatur P3",
      chrono_p3_temperature_water_set: "Temp. Wasser P3",
      chrono_p4_canl_set: "Belüftung Can. L.",
      chrono_p4_canr_set: "Belüftung Can. R.",
      chrono_p4_day_friday_set: "Einschalten. Freitag P4",
      chrono_p4_day_monday_set: "Einschalten. Montag P4",
      chrono_p4_day_saturday_set: "Einschalten. Samstag P4",
      chrono_p4_day_sunday_set: "Einschalten. Sonntag P4",
      chrono_p4_day_thursday_set: "Einschalten. Donnerstag P4",
      chrono_p4_day_tuesday_set: "Einschalten. Dienstag P4",
      chrono_p4_day_wednesday_set: "Einschalten. Mittwoch P4",
      chrono_p4_enable_set: "Einschalten. P4",
      chrono_p4_fan_front_enable: "Belüftung F.",
      chrono_p4_fan_rear_set: "Belüftung R.",
      chrono_p4_fan_set: "Stellen Sie die P4-Belüftung ein",
      chrono_p4_multifire_1_set: "Multifuoco 1 P4",
      chrono_p4_multifire_2_set: "Multifuoco 2 P4",
      chrono_p4_power_set: "Stellen Sie P4 ein",
      chrono_p4_start_set: "Schalten Sie P4 ein",
      chrono_p4_stop_set: "Schalten Sie P4 aus",
      chrono_p4_t_rear_set: "Temperatur R.",
      chrono_p4_tcanl_set: "Temperatur can. L.",
      chrono_p4_tcanr_set: "Temperatur can. R.",
      chrono_p4_temperature_set: "Lufttemperatur P4",
      chrono_p4_temperature_water_set: "Temp. Wasser P4",
      chrono_p5_canl_set: "Belüftung Can. L.",
      chrono_p5_canr_set: "Belüftung Can. R.",
      chrono_p5_day_friday_set: "Einschalten. Freitag P5",
      chrono_p5_day_monday_set: "Einschalten. Montag P5",
      chrono_p5_day_saturday_set: "Einschalten. Samstag P5",
      chrono_p5_day_sunday_set: "Einschalten. Sonntag P5",
      chrono_p5_day_thursday_set: "Einschalten. Donnerstag P5",
      chrono_p5_day_tuesday_set: "Einschalten. Dienstag P5",
      chrono_p5_day_wednesday_set: "Einschalten. Mittwoch P5",
      chrono_p5_enable_set: "Einschalten. P5",
      chrono_p5_fan_front_enable: "Belüftung F.",
      chrono_p5_fan_rear_set: "Belüftung R.",
      chrono_p5_fan_set: "P5-Belüftung einstellen",
      chrono_p5_multifire_1_set: "Multifuoco 1 P5",
      chrono_p5_multifire_2_set: "Multifuoco 2 P5",
      chrono_p5_power_set: "Stellen Sie den P5 ein",
      chrono_p5_start_set: "Schalten Sie P5 ein",
      chrono_p5_stop_set: "P5 ausschalten",
      chrono_p5_t_rear_set: "Temperatur R.",
      chrono_p5_tcanl_set: "Temperatur can. L.",
      chrono_p5_tcanr_set: "Temperatur can. R.",
      chrono_p5_temperature_set: "Lufttemperatur P5",
      chrono_p5_temperature_water_set: "Temp. Wasser P5",
      chrono_p6_canl_set: "Belüftung Can. L.",
      chrono_p6_canr_set: "Belüftung Can. R.",
      chrono_p6_day_friday_set: "Einschalten. Freitag P6",
      chrono_p6_day_monday_set: "Einschalten. Montag P6",
      chrono_p6_day_saturday_set: "Einschalten. Samstag P6",
      chrono_p6_day_sunday_set: "Einschalten. Sonntag P6",
      chrono_p6_day_thursday_set: "Einschalten. Donnerstag P6",
      chrono_p6_day_tuesday_set: "Einschalten. Dienstag P6",
      chrono_p6_day_wednesday_set: "Einschalten. Mittwoch P6",
      chrono_p6_enable_set: "Einschalten. P6",
      chrono_p6_fan_front_enable: "Belüftung F.",
      chrono_p6_fan_rear_set: "Belüftung R.",
      chrono_p6_fan_set: "P6-Belüftung einstellen",
      chrono_p6_multifire_1_set: "Multifuoco 1 P6",
      chrono_p6_multifire_2_set: "Multifuoco 2 P6",
      chrono_p6_power_set: "Stellen Sie P6 ein",
      chrono_p6_start_set: "Schalten Sie P6 ein",
      chrono_p6_stop_set: "Schalten Sie P6 aus",
      chrono_p6_t_rear_set: "Temperatur R.",
      chrono_p6_tcanl_set: "Temperatur can. L.",
      chrono_p6_tcanr_set: "Temperatur can. R.",
      chrono_p6_temperature_set: "Lufttemperatur P6",
      chrono_p6_temperature_water_set: "Temp. Wasser P6",
      chrono_week_enable_set: "Aktivieren Sie den Timer",
      cicalino_set: "Ton einschalten",
      clock_hour_set: "Stunden",
      clock_minute_set: "Minuten",
      eco_stop_set: "ECO-STOP",
      eco_temp_stop: "T. ECO STOP",
      ext_therm_get: "Kontaktieren Sie ext.therm",
      flusso_aria_get: "Flusso aria",
      fun_auto_get: "AUTO",
      fun_auto_set: "AUTO",
      fun_pwf_get: "POWERFUL",
      fun_pwf_set: "POWERFUL",
      giri_estrattore_get: "Giri Estr.",
      hw_navel_code_get: "Cod. Wifi Registerkarte",
      hw_navel_fw_revision_get: "FW rev. WLAN-Karte",
      hw_navel_fw_type_get: "FW Fahrplan WIFI",
      hw_power_code_get: "Stromkartencode",
      hw_power_fw_revision_get: "FW rev. Leistungsplatine",
      hw_power_fw_type_get: "FW-Stromkarte",
      hydro_system_type_get: "Lebenslauf-Installationsplan",
      multifire_1_enable: "Multifuoco 1",
      multifire_1_max: "Multifuoco 1 max",
      multifire_1_min: "Multifuoco 1 Min",
      multifire_1_set: "Kanalisiert 1",
      multifire_1_temp_air_enable: "Multifuoco 1 Temp.",
      multifire_1_temp_air_get: "Multifuoco 1 Temp.",
      multifire_1_temp_air_max: "Multifuoco 1 Temp. Max",
      multifire_1_temp_air_min: "Multifuoco 1 Temp. min",
      multifire_1_temp_air_set: "Multifuoco 1 Temp. Serie",
      multifire_2_enable: "Multifuoco 2",
      multifire_2_max: "Multifuoco 2 max",
      multifire_2_min: "Multifuoco 2 Min",
      multifire_2_set: "Kanalisiert 2",
      multifire_2_temp_air_enable: "Multifuoco 2 Temp.",
      multifire_2_temp_air_get: "Multifuoco 2 Temp.",
      multifire_2_temp_air_max: "Multifuoco 2 Temp. Max",
      multifire_2_temp_air_min: "Multifuoco 2 Temp. min",
      multifire_2_temp_air_set: "Multifuoco 2 Temp. Serie",
      n_banca_dati_get: "Datenbanknummer",
      ore_lavoro_par_get: "Teil Stunden",
      ore_lavoro_tot_get: "Gesamtstunden",
      pascal_get: "Pascal",
      pellet_type_get: "Pellet type",
      pop_up_get: "Pop up",
      popup_door_open_get: "Tür öffnen",
      popup_pa_get: "Pa fehlerhaft",
      popup_pellet_empty_get: "Leere Pellets",
      popup_pellet_open_get: "Pellets öffnen",
      popup_tcj_get: "Schlechte Dämpfe",
      popup_tck_get: "Schlechte Flamme",
      power_auto_set: "Automatische Stromversorgung",
      power_enable: "Macht",
      power_max: "Max. Macht",
      power_min: "Min. Macht",
      power_night_enable: "Nachtleistung",
      power_night_max: "Nachtleistung max",
      power_night_min: "Nachtleistung min",
      power_night_set: "Nachtmacht",
      power_set: "Macht",
      pressione_get: "Press.",
      prod_budge_number_get: "Nummer",
      prod_lot_number_get: "Lotto",
      prod_model_get: "Modell",
      prod_serial_number_get: "Seriennummer",
      real_power_get: "Real Power",
      season_get: "Season",
      season_set: "Modality",
      sonda_ambiente_get: "Sonda amb.",
      sonda_ambiente_set: "Sonda amb.",
      standby_get: "Stand by",
      standby_set: "Stand by",
      status_get: "Status",
      status_managed_get: "Administratorstatus",
      status_managed_off_enable: "Aus",
      status_managed_on_enable: "EIN",
      temp_air_get: "Zimmertemperatur",
      temp_air_max: "Temp. Luft max",
      temp_air_min: "Temp. Airmin",
      temp_air_palm_get: "T. Palm.",
      temp_air_palm_set: "T. Umwelt",
      temp_air_set: "T. Umwelt",
      temp_air2_get: "Zimmertemperatur",
      temp_air2_set: "T. Umwelt",
      temp_board_get: "T. board",
      temp_cool_set: "T. Set",
      temp_gas_flue_get: "Temp.Fuel Gas",
      temp_h2o_boiler_get: "H2O Boiler",
      temp_h2o_boiler_set: "Set Boiler",
      temp_h2o_mandata_get: "H2O Mandata",
      temp_h2o_mandata_set: "Set H2O Cald.",
      temp_h2o_ritorno_get: "H2O Ritorno",
      temp_heat_set: "T. Set",
      temp_humidity_get: "Humidity",
      temp_probe_j_get: "Smoke temp J",
      temp_probe_k_get: "Abgast.",
      temp_rear_get: "Zimmertemperatur rear",
      temp_rear_set: "T. Umwelt rear",
      temp_rear2_get: "Zimmertemperatur rear",
      temp_rear2_set: "T. Umwelt rear",
      temp_water_boiler_enable: "Set Temp Wasserkocher",
      temp_water_boiler_get: "Temp. Kessel",
      temp_water_boiler_max: "Set Temp Wasserkocher max",
      temp_water_boiler_min: "Set Temp Wasserheizung min",
      temp_water_boiler_set: "Set Temp Wasserkocher",
      temp_water_enable: "Wassertemperatur",
      temp_water_get: "Water Temp.",
      temp_water_max: "Max Wassertemp",
      temp_water_min: "Min. Wassertemperatur",
      temp_water_puffer_enable: "Legen Sie den Temperaturpuffer fest",
      temp_water_puffer_get: "Temp Puffer",
      temp_water_puffer_max: "Temp Puffer max",
      temp_water_puffer_min: "Temp Puffer min",
      temp_water_puffer_set: "Legen Sie den Temperaturpuffer fest",
      temp_water_san_set: "Stellen Sie Temp Sani ein",
      temp_water_set: "Temp Wasser einstellen",
      therm_ext_get: "T. EXT",
      thermostat_contact_1_get: "Therm RR",
      thermostat_contact_2_get: "Therm RL",
      thermostat_contact_get: "Therm",
      thermostat_contact_rear_get: "Therm Rear",
      vent_front_get: "Ventilazion",
      vent_front_set: "Belüftung",
      vent_front2_get: "Ventilazion",
      vent_front2_set: "Belüftung",
      vent_main_set: "Belüftung",
      vent_rear_get: "Ventilazion Rear",
      vent_rear_set: "Hinterlüftung",
      vent_rear2_get: "Ventilazion Rear",
      vent_rear2_set: "Hinterlüftung",
      vie_3_get: "V. 3 Vie",
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
        Authorization: this.config.os,
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
            this.json2iob.parse(id + ".general", device, { forceIndex: true, descriptions: this.desc });
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
                  descriptions: this.desc,
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
              this.log.info("Adapter is logged out. Relogin in 30seconds.");
              this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
              this.refreshTokenTimeout = setTimeout(async () => {
                await this.refreshToken();
                await this.updateDevices();
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
