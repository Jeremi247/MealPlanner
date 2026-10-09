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

  // The image path for a food id, relative to site/index.html.
  function src(id) { return 'img/foods/' + BY_FOOD[id] + '.png'; }

  NM.Icons = { BY_FOOD: BY_FOOD, src: src };
})(window.NM = window.NM || {});
