/**
 * @class Haltestelle
 * @desc Definition der Attribute von einer Haltestelle
 * @param {*} nr Die Nummer von der Haltestelle
 * @param {*} name Name der Haltestelle
 * @param {*} richtung Richtung in die die Busse fahren
 * @param {*} koordinaten Koordinaten der Haltestelle
 * @param {*} aURL URL um die Abfahrten der Haltestelle in den nächsten 5 Minuten zu bekommen
 */
class Haltestelle {
    constructor(nr, lbez, richtung, coordinates) {
          this.nr = nr;
          this.lbez = lbez;
          this.richtung = richtung;
          this.coordinates = coordinates;
          this.aURL = `https://rest.busradar.conterra.de/prod/haltestellen/${nr}/abfahrten?sekunden=300`;
    }

    
}