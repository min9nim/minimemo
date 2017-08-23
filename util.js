
if(typeof String.prototype.replaceAll == "undefined") {
  String.prototype.replaceAll = function(source, target) {
      source = source.replace(/(\W)/g, "\\$1");
      return this.replace(new RegExp(source, "gi"), target);
  };
}
