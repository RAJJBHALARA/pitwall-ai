export const DRIVER_FLAGS = {
  VER: "nl",  HAM: "gb",  LEC: "mc",
  NOR: "gb",  PIA: "au",  RUS: "gb",
  SAI: "es",  ALO: "es",  STR: "ca",
  OCO: "fr",  GAS: "fr",  TSU: "jp",
  BOT: "fi",  ZHO: "cn",  MAG: "dk",
  HUL: "de",  ALB: "th",  COL: "ar",
  BEA: "nz",  DOO: "au",  ANT: "br",
  HAD: "nz",  BOR: "fr",  LAW: "nz"
}

export const getFlagUrl = (driverCode) => {
  const code = DRIVER_FLAGS[driverCode] || "un"
  return `https://flagcdn.com/24x18/${code}.png`
}
