app.config(['$stateProvider', '$urlRouterProvider',
 function($stateProvider, $router) {
   $router.otherwise('/');

   $stateProvider
   .state('home', {
      url: '/',
      templateUrl: 'Home/home.template.html',
      controller: 'homeController'
   })
   .state('inst', {
      url: '/inst',
      templateUrl: 'Inst/inst.template.html',
      controller: 'instController'
   })
   .state('plot', {
      url: '/plot',
      templateUrl: 'Plot/plot.template.html',
      controller: 'plotController'
   });
}]);
