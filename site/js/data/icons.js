// Which Fluent 3D emoji stands for each food, by food id. The images are site/img/foods/<name>.png,
// copied from github.com/microsoft/fluentui-emoji (MIT). Where no emoji is the food itself, the
// closest one for it or its group stands in — see docs/decisions/0013-foods-are-shown-as-fluent-3d-emoji.md.
(function (NM) {
  'use strict';

  var BY_FOOD = {
    // The food itself.
    'shrimp': 'shrimp', 'crab': 'crab', 'lobster': 'lobster', 'kidney-beans': 'beans', 'eggs': 'egg',
    'broccoli': 'broccoli', 'bok-choy': 'leafy-green', 'mushrooms': 'brown-mushroom', 'cucumber': 'cucumber',
    'carrots': 'carrot', 'tomatoes': 'tomato', 'red-pepper': 'bell-pepper', 'eggplant': 'eggplant',
    'strawberries': 'strawberry', 'watermelon': 'watermelon', 'cantaloupe': 'melon', 'olives': 'olive',
    'avocado': 'avocado', 'potatoes': 'potato', 'white-rice': 'cooked-rice', 'tuna': 'canned-food',

    // A stand-in for the food or its group.
    'chicken-breast': 'poultry-leg', 'chicken-thigh': 'poultry-leg', 'chicken-gizzards': 'chicken',
    'turkey': 'turkey', 'egg-whites': 'cooking', 'tilapia': 'fish', 'cod': 'fish', 'canned-salmon': 'fish',
    'greek-yogurt-0': 'bowl-with-spoon', 'skyr': 'bowl-with-spoon',
    'cottage-0': 'cheese-wedge', 'cottage-1': 'cheese-wedge', 'cottage-4': 'cheese-wedge',
    'edamame': 'pea-pod', 'split-peas': 'pea-pod', 'green-beans': 'pea-pod', 'lentils': 'beans',
    'pork-loin': 'pig', 'lean-beef': 'cut-of-meat',
    'cabbage': 'leafy-green', 'napa-cabbage': 'leafy-green', 'spinach': 'leafy-green', 'celery': 'leafy-green',
    'lettuce': 'green-salad', 'arugula': 'herb', 'asparagus': 'herb', 'cauliflower': 'broccoli',
    'zucchini': 'cucumber', 'summer-squash': 'cucumber', 'pumpkin': 'jack-o-lantern', 'radishes': 'carrot',
    'kimchi': 'hot-pepper', 'konjac': 'steaming-bowl', 'jello-sf': 'custard',
    'oil': 'olive', 'mayo-half': 'jar', 'tahini': 'jar', 'chia': 'seedling', 'cream-cheese-light': 'butter',
    'peanut-butter': 'peanuts', 'almonds': 'chestnut', 'almond-butter': 'chestnut', 'walnuts': 'chestnut',
    'pistachios': 'chestnut', 'cashews': 'chestnut'
  };

  // Every picture there is, by name: what a food of your own can be shown as. Each has both styles.
  var NAMES = Object.keys(NM.MinimalIcons).sort();

  // A food of your own whose picture is unknown, or not chosen, is shown as this.
  var FALLBACK = 'steaming-bowl';

  // The picture's name for a food: its own choice for one of yours, or BY_FOOD for a table row.
  function nameOf(food) {
    var n = food.icon || BY_FOOD[food.id];
    return n && NM.MinimalIcons[n] ? n : FALLBACK;
  }

  // The 3D image's path for a picture's name, relative to site/index.html.
  function srcOf(name) { return 'img/foods/' + name + '.png'; }

  // The 3D image's path for a table row's id.
  function src(id) { return srcOf(BY_FOOD[id]); }

  // A picture by name in a style, for Format.icon: { src } for 'emoji' (the default), or
  // { paths } from NM.MinimalIcons for 'minimal'.
  function named(name, style) {
    return style === 'minimal' ? { paths: NM.MinimalIcons[name] } : { src: srcOf(name) };
  }

  // A food's picture in a style. `food` is a record from Nutrition.normalise, or { id } for a table row.
  function picture(food, style) { return named(nameOf(food), style); }

  NM.Icons = { BY_FOOD: BY_FOOD, NAMES: NAMES, FALLBACK: FALLBACK, nameOf: nameOf, src: src, srcOf: srcOf, named: named, picture: picture };
})(window.NM = window.NM || {});
