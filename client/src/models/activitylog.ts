import { LastFetchedIds } from './utils';

export class ActivityLogModel {
  public id: number;
  public event_action: string;
  public event_subject: string;
  public actor: string;
  public created_at: string;
  public object_id: number;
  public object_name: string;
}

export class ActivityLogsStateSchema {
  public byIds: {[id: number]: ActivityLogModel};
  public ids: number[];
  public lastFetched: LastFetchedIds;
}

export const ActivityLogsEmptyState = {
  byIds: {},
  ids: [],
  lastFetched: new LastFetchedIds()
};
