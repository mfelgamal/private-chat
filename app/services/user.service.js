(function() {
  'use strict';

  angular
    .module('app')
    .factory('UserService', UserService);

  UserService.$inject = ['$http'];

  function UserService($http) {
    var service = {};

    service.GetAll = GetAll;
    service.GetAllFriends = GetAllFriends;
    service.AddFriend = AddFriend;
    service.GetById = GetById;
    service.GetByUsername = GetByUsername;
    service.Create = Create;


    return service;

    function GetAll() {
      return $http.get('/api/users').then(handleSuccess, handleError('Error getting all users'));
    }

    function GetAllFriends(id) {
      return $http.get('/api/friends/' + id).then(handleSuccess, handleError('Error getting all friends'));
    }

    function AddFriend(first_user_id, second_user_id) {
      return $http.post('/api/users/add_friend/', { from: first_user_id, to: second_user_id }).then(handleSuccess, handleError('Error creating relation'));
    }

    function GetById(id) {
      return $http.get('/api/users/' + id).then(handleSuccess, handleError('Error getting user by id'));
    }

    function GetByUsername(username) {
      return $http.get('/api/users/' + username).then(handleSuccess, handleError('Error getting user by username'));
    }

    function Create(user) {
      return $http.post('/api/users', user).then(handleSuccess, handleError('Error creating user'));
    }

    // private functions

    function handleSuccess(res) {
      return res.data;
    }

    function handleError(error) {
      return function() {
        return { success: false, message: error };
      };
    }
  }

})();
