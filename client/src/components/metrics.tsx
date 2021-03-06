import * as React from 'react';
import * as moment from 'moment';

import * as actions from '../actions/metrics';
import { MetricModel } from '../models/metric';
import MetricLineChart from './metricLineChart';

import './metrics.less';
import { Data, DataPoint } from '../constants/charts';
import { EmptyList } from './empty/emptyList';

export interface Props {
  metrics: MetricModel[];
  count: number;
  fetchData: () => actions.MetricsAction;
}

export default class Metrics extends React.Component<Props, {}> {
  componentDidMount() {
    this.props.fetchData();
  }

  public render() {

    let convertTimeFormat = (d: string) => {
      return moment(d).format('DD-MM HH:mm');
    };

    let getMetricComponentData = () => {
      let metrics = this.props.metrics;
      let metricData: { [key: string]: DataPoint[] } = {};

      for (let metric of metrics) {
        let createdAt = metric.created_at;
        for (let metricName of Object.keys(metric.values)) {
          let dataPoint = {index: convertTimeFormat(createdAt), value: metric.values[metricName]};
          if (metricName in metricData) {
            metricData[metricName].push(dataPoint);
          } else {
            metricData[metricName] = [dataPoint];
          }
        }
      }

      let data: Data[] = [];

      for (let metricName of Object.keys(metricData)) {
        data.push(
          {
            key: metricName,
            values: metricData[metricName]
          }
        );
      }
      return data;
    };

    let getMetricComponent = () => {
      if (this.props.count === 0) {
        return EmptyList(false, 'metric', 'metric');
      } else {
        let data = getMetricComponentData();
        return data.map(
          (mData, idx) => {
            return (
              <div className="metric-item" key={idx}>
                {MetricLineChart(mData)}
              </div>
            );
          }
        );
      }
    };

    return (
      <div className="metrics">
        <div className="row">
          <div className="col-md-12">
            <div className="metrics-header">
              Metrics
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-10 col-md-offset-1">
            <div className="metrics-content">
              {getMetricComponent()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
