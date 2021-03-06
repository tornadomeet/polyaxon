import { Action } from 'redux';
import * as url from 'url';

import { BASE_API_URL } from '../constants/api';
import {
  getBuildUniqueName,
  getBuildUrl,
  handleAuthError,
  urlifyProjectName
} from '../constants/utils';
import { getBuildUrlFromName, getProjectUrl } from '../constants/utils';
import history from '../history';
import { BookmarkModel } from '../models/bookmark';
import { BuildModel } from '../models/build';

export enum actionTypes {
  CREATE_BUILD = 'CREATE_BUILD',
  DELETE_BUILD = 'DELETE_BUILD',
  STOP_BUILD = 'STOP_BUILD',
  UPDATE_BUILD = 'UPDATE_BUILD',
  RECEIVE_BUILD = 'RECEIVE_BUILD',
  RECEIVE_BUILDS = 'RECEIVE_BUILDS',
  REQUEST_BUILD = 'REQUEST_BUILD',
  REQUEST_BUILDS = 'REQUEST_BUILDS',
  BOOKMARK_BUILD = 'BOOKMARK_BUILD',
  UNBOOKMARK_BUILD = 'UNBOOKMARK_BUILD',
}

export interface CreateUpdateReceiveBuildAction extends Action {
  type: actionTypes.CREATE_BUILD | actionTypes.UPDATE_BUILD | actionTypes.RECEIVE_BUILD;
  build: BuildModel;
}

export interface DeleteBuildAction extends Action {
  type: actionTypes.DELETE_BUILD;
  buildName: string;
}

export interface StopBuildAction extends Action {
  type: actionTypes.STOP_BUILD;
  buildName: string;
}

export interface BookmarkBuildAction extends Action {
  type: actionTypes.BOOKMARK_BUILD | actionTypes.UNBOOKMARK_BUILD;
  buildName: string;
}

export interface ReceiveBuildsAction extends Action {
  type: actionTypes.RECEIVE_BUILDS;
  builds: BuildModel[];
  count: number;
}

export interface RequestBuildsAction extends Action {
  type: actionTypes.REQUEST_BUILDS | actionTypes.REQUEST_BUILD;
}

export type BuildAction =
  CreateUpdateReceiveBuildAction
  | DeleteBuildAction
  | StopBuildAction
  | ReceiveBuildsAction
  | RequestBuildsAction
  | BookmarkBuildAction;

export function createBuildActionCreator(build: BuildModel): CreateUpdateReceiveBuildAction {
  return {
    type: actionTypes.CREATE_BUILD,
    build
  };
}

export function updateBuildActionCreator(build: BuildModel): CreateUpdateReceiveBuildAction {
  return {
    type: actionTypes.UPDATE_BUILD,
    build
  };
}

export function deleteBuildActionCreator(buildName: string): DeleteBuildAction {
  return {
    type: actionTypes.DELETE_BUILD,
    buildName
  };
}

export function stopBuildActionCreator(buildName: string): StopBuildAction {
  return {
    type: actionTypes.STOP_BUILD,
    buildName
  };
}

export function requestBuildActionCreator(): RequestBuildsAction {
  return {
    type: actionTypes.REQUEST_BUILD,
  };
}

export function requestBuildsActionCreator(): RequestBuildsAction {
  return {
    type: actionTypes.REQUEST_BUILDS,
  };
}

export function receiveBuildActionCreator(build: BuildModel): CreateUpdateReceiveBuildAction {
  return {
    type: actionTypes.RECEIVE_BUILD,
    build
  };
}

export function receiveBuildsActionCreator(builds: BuildModel[], count: number): ReceiveBuildsAction {
  return {
    type: actionTypes.RECEIVE_BUILDS,
    builds,
    count
  };
}

export function receiveBookmarkedBuildsActionCreator(bookmarkedBuilds: BookmarkModel[],
                                                     count: number): ReceiveBuildsAction {
  const builds: BuildModel[] = [];
  for (const bookmarkedBuild of bookmarkedBuilds) {
    builds.push(bookmarkedBuild.content_object as BuildModel);
  }
  return {
    type: actionTypes.RECEIVE_BUILDS,
    builds,
    count
  };
}

export function bookmarkBuildActionCreator(buildName: string) {
  return {
    type: actionTypes.BOOKMARK_BUILD,
    buildName,
  };
}

export function unbookmarkBuildActionCreator(buildName: string) {
  return {
    type: actionTypes.UNBOOKMARK_BUILD,
    buildName,
  };
}

function _fetchBuilds(buildsUrl: string,
                      bookmarks: boolean,
                      filters: { [key: string]: number | boolean | string } = {},
                      dispatch: any,
                      getState: any): any {
    dispatch(requestBuildsActionCreator());
    const urlPieces = location.hash.split('?');
    const baseUrl = urlPieces[0];
    if (Object.keys(filters).length) {
      buildsUrl += url.format({query: filters});
      if (baseUrl) {
        history.push(baseUrl + url.format({query: filters}));
      }
    } else if (urlPieces.length > 1) {
      history.push(baseUrl);
    }
    return fetch(
      buildsUrl, {
        headers: {
          Authorization: 'token ' + getState().auth.token
        }
      })
      .then((response) => handleAuthError(response, dispatch))
      .then((response) => response.json())
      .then((json) => bookmarks ?
        dispatch(receiveBookmarkedBuildsActionCreator(json.results, json.count)) :
        dispatch(receiveBuildsActionCreator(json.results, json.count)));
}

export function fetchBookmarkedBuilds(user: string,
                                      filters: { [key: string]: number | boolean | string } = {}): any {
  return (dispatch: any, getState: any) => {
    const buildsUrl = `${BASE_API_URL}/bookmarks/${user}/builds/`;
    return _fetchBuilds(buildsUrl, true, filters, dispatch, getState);
  };
}

export function fetchBuilds(projectUniqueName: string,
                            filters: { [key: string]: number | boolean | string } = {}): any {
  return (dispatch: any, getState: any) => {
    const buildsUrl = `${BASE_API_URL}/${urlifyProjectName(projectUniqueName)}/builds`;
    return _fetchBuilds(buildsUrl, false, filters, dispatch, getState);
  };
}

export function fetchBuild(user: string, projectName: string, buildId: number | string): any {
  const buildUrl = getBuildUrl(user, projectName, buildId, false);
  return (dispatch: any, getState: any) => {
    dispatch(requestBuildActionCreator());
    return fetch(
      `${BASE_API_URL}${buildUrl}`, {
        headers: {
          Authorization: 'token ' + getState().auth.token
        }
      })
      .then((response) => handleAuthError(response, dispatch))
      .then((response) => response.json())
      .then((json) => dispatch(receiveBuildActionCreator(json)));
  };
}

export function deleteBuild(buildName: string, redirect: boolean = false): any {
  const buildUrl = getBuildUrlFromName(buildName, false);
  return (dispatch: any, getState: any) => {
    return fetch(
      `${BASE_API_URL}${buildUrl}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'token ' + getState().auth.token,
          'X-CSRFToken': getState().auth.csrftoken
        },
      })
      .then((response) => handleAuthError(response, dispatch))
      .then(() => {
        const dispatched = dispatch(deleteBuildActionCreator(buildName));
        if (redirect) {
          const values = buildName.split('.');
          history.push(getProjectUrl(values[0], values[1], true) + '#builds');
        }
        return dispatched;
      });
  };
}

export function stopBuild(buildName: string): any {
  const buildUrl = getBuildUrlFromName(buildName, false);
  return (dispatch: any, getState: any) => {
    return fetch(
      `${BASE_API_URL}${buildUrl}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + getState().auth.token,
          'X-CSRFToken': getState().auth.csrftoken
        },
      })
      .then((response) => handleAuthError(response, dispatch))
      .then(() => dispatch(stopBuildActionCreator(buildName)));
  };
}

export function bookmark(buildName: string): any {
  const buildUrl = getBuildUrlFromName(buildName, false);
  return (dispatch: any, getState: any) => {
    return fetch(
      `${BASE_API_URL}${buildUrl}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + getState().auth.token,
          'X-CSRFToken': getState().auth.csrftoken
        },
      })
      .then((response) => handleAuthError(response, dispatch))
      .then(() => dispatch(bookmarkBuildActionCreator(buildName)));
  };
}

export function unbookmark(buildName: string): any {
  const buildUrl = getBuildUrlFromName(buildName, false);
  return (dispatch: any, getState: any) => {
    return fetch(
      `${BASE_API_URL}${buildUrl}/unbookmark`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'token ' + getState().auth.token,
          'X-CSRFToken': getState().auth.csrftoken
        },
      })
      .then((response) => handleAuthError(response, dispatch))
      .then(() => dispatch(unbookmarkBuildActionCreator(buildName)));
  };
}
