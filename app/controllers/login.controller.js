(function() {
  'use strict';

  angular
    .module('app')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$location', 'AuthenticationService', 'FlashService', '$scope'];

  function LoginController($location, AuthenticationService, FlashService, $scope) {

    $scope.login = login;

    (function initController() {
      // reset login status
      AuthenticationService.ClearCredentials();
    })();

    function login() {
      $scope.dataLoading = true;
      AuthenticationService.Login($scope.username, $scope.password, function(response) {
        if (response.success) {
          AuthenticationService.SetCredentials(response._id, $scope.username, $scope.password);
          $location.path('/');
        } else {
          FlashService.Error(response.message);
          $scope.dataLoading = false;
        }
      });
    };
  }

})();
