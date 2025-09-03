$(document).ready(function () {
  // Your code goes here
$("<div>")
  .css("height", 15)
  .css("width", 15)
  .css("background-color", "black")
  .css("position", "absolute")
  .css("top", 50)
  .css("left", 50)
  .appendTo("#die");
function makeDot(top, left, elementID){
  $("<div>")
  .css("height", 15)
  .css("width", 15)
  .css("background-color", "black")
  .css("position", "absolute")
  .css("top", 50)
  .css("left", 50)
  .appendTo("#die");
}
function rollDice(){
  $("#die").empty();
  console.log("clicked")
  var randomNum = Math.ceil(Math.random() * 6);
  console.log(randomNum);
  if (randomNum === 1) {
  makeDot(50, 50, "#die"); // middle middle
} else if (randomNum === 2) {
  makeDot(25, 25, "#die"); // top left
  makeDot(75, 75, "#die"); // bottom right
} else if (randomNum === 3) {
  makeDot(25, 25, "#die"); // top left
  makeDot(75, 75, "#die"); // bottom right
  makeDot(50, 50, "#die"); // middle middle
} else if (randomNum === 4) {
  makeDot(75, 75, "#die"); // bottom right
  makeDot(25, 25, "#die"); // top left
  makeDot(25, 75, "#die"); // bottom left
  makeDot(75, 25, "#die"); // top right
} else if (randomNum === 5) {
  makeDot(50, 50, "#die"); // middle middle
  makeDot(75, 75, "#die"); // bottom right
  makeDot(25, 25, "#die"); // top left
  makeDot(25, 75, "#die"); // bottom left
  makeDot(75, 25, "#die"); // top right
}
}
$("#die").on("click", handleClick);
});
