/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Stack, TooltipHostBase } from '@fluentui/react'
import { SelectionMode } from '@fluentui/utilities'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { memo, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { ByteSizeWithDiff } from '@perfsee/bundle-report/bundle-detail/components'
import { IconWithTips, Table, TableColumnProps } from '@perfsee/components'
import { MetricType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { UnderlineText } from '../styled'

import { MetricDiff } from './metric-diff'
import { GroupUsageModule, ProjectUsageInfo } from './module'
import { getAverageBundleSize, getAverageInitialSize, getLabAverageMetricValue } from './utils'

const columns = [
  {
    key: 'id',
    name: 'Project',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => {
      return <Link to={pathFactory.project.home({ projectId: item.id })}>{item.id}</Link>
    },
  },
  {
    key: 'jobDuration',
    name: 'Job Duration',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => <div>{item.usage.jobDuration}mins</div>,
  },
  {
    key: 'storage',
    name: 'Storage',
    minWidth: 90,
    maxWidth: 120,
    onRender: (item) => <div>{item.usage.storage} MB</div>,
  },
  {
    key: 'jobCount',
    name: 'Job count',
    minWidth: 90,
    maxWidth: 120,
    onRender: (item) => <div>{item.usage.jobCount}</div>,
  },
  {
    key: 'labScore',
    name: 'Lab score',
    minWidth: 120,
    maxWidth: 180,
    onRenderHeader: () => {
      return (
        <Stack horizontal>
          Lab score
          <IconWithTips marginLeft="4px" content="During this time period, display the average score of all records" />
        </Stack>
      )
    },
    onRender: (item) => {
      const { averageScore, minScore, maxScore } = item.labScores

      const content = (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
          <div>
            <p>min score: {typeof minScore === 'number' ? minScore : '-'}</p>
            <p>max score: {typeof maxScore === 'number' ? maxScore : '-'}</p>
          </div>
        </Stack>
      )

      if (typeof averageScore !== 'number') {
        return '-'
      }

      return (
        <TooltipHostBase content={content}>
          <UnderlineText>{averageScore.toFixed(2)}</UnderlineText>
        </TooltipHostBase>
      )
    },
  },
  {
    key: 'bundleScore',
    minWidth: 120,
    maxWidth: 180,
    onRenderHeader: () => {
      return (
        <Stack horizontal>
          Bundle score
          <IconWithTips marginLeft="4px" content="During this time period, display the average score of all records" />
        </Stack>
      )
    },
    onRender: (item) => {
      const { averageScore, minScore, maxScore } = item.bundleScores

      const content = (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
          <div>
            <p>min score: {typeof minScore === 'number' ? minScore : '-'}</p>
            <p>max score: {typeof maxScore === 'number' ? maxScore : '-'}</p>
          </div>
        </Stack>
      )

      if (typeof averageScore !== 'number') {
        return '-'
      }

      return (
        <TooltipHostBase content={content}>
          <UnderlineText>{averageScore.toFixed(2)}</UnderlineText>
        </TooltipHostBase>
      )
    },
  },
  {
    key: 'bundleSize',
    minWidth: 120,
    maxWidth: 180,
    onRenderHeader: () => {
      return (
        <Stack horizontal>
          Bundle Size
          <IconWithTips
            marginLeft="4px"
            content="The value is the average value of all entrypoints. The latest record is displayed, compared with the oldest record. "
          />
        </Stack>
      )
    },
    onRender: ({ artifactRecords }) => {
      if (!artifactRecords?.length) {
        return '-'
      }

      if (artifactRecords.length === 1) {
        const size = getAverageBundleSize(artifactRecords[0].entrypoints)
        return size ? <ByteSizeWithDiff current={size} hideIfNonComparable={true} /> : '-'
      }

      const [oldest, latest] = artifactRecords
      const latestSize = getAverageBundleSize(latest.entrypoints)
      const oldestSize = getAverageBundleSize(oldest.entrypoints)

      if (!latestSize) {
        return '-'
      }

      return <ByteSizeWithDiff current={latestSize} baseline={oldestSize} hideIfNonComparable={true} />
    },
  },
  {
    key: 'initialSize',
    minWidth: 120,
    maxWidth: 180,
    onRenderHeader: () => {
      return (
        <Stack horizontal>
          initial JS Size
          <IconWithTips
            marginLeft="4px"
            content="The value is the average value of all entrypoints. The latest record is displayed, compared with the oldest record. "
          />
        </Stack>
      )
    },
    onRender: ({ artifactRecords }) => {
      if (!artifactRecords?.length) {
        return '-'
      }

      if (artifactRecords.length === 1) {
        const size = getAverageInitialSize(artifactRecords[0].entrypoints)
        return size ? <ByteSizeWithDiff current={size} hideIfNonComparable={true} /> : '-'
      }

      const [oldest, latest] = artifactRecords
      const latestSize = getAverageInitialSize(latest.entrypoints)
      const oldestSize = getAverageInitialSize(oldest.entrypoints)

      if (!latestSize) {
        return '-'
      }

      return <ByteSizeWithDiff current={latestSize} baseline={oldestSize} hideIfNonComparable={true} />
    },
  },
  ...Object.keys(MetricType).map((key) => {
    return {
      key: key,
      minWidth: 120,
      maxWidth: 180,
      onRenderHeader: () => {
        return (
          <Stack horizontal>
            {key}
            <IconWithTips
              marginLeft="4px"
              content="The displayed value is the average value of the reports in latest snapshot. Compared with the oldest record. "
            />
          </Stack>
        )
      },
      onRender: ({ snapshotRecords }: ProjectUsageInfo) => {
        if (!snapshotRecords?.length) {
          return '-'
        }

        if (snapshotRecords.length === 1) {
          const value = getLabAverageMetricValue(snapshotRecords[0].snapshotReports, MetricType[key])

          return <MetricDiff type={key} current={value} />
        }

        const [oldest, latest] = snapshotRecords
        const latestValue = getLabAverageMetricValue(latest.snapshotReports, MetricType[key])
        const oldestValue = getLabAverageMetricValue(oldest.snapshotReports, MetricType[key])

        return <MetricDiff type={key} current={latestValue} baseline={oldestValue} />
      },
    }
  }),
] as TableColumnProps<ProjectUsageInfo>[]

type Props = {
  startTime: number
  endTime: number
  groupId: string
}
export const GroupTable = memo(({ startTime, endTime, groupId }: Props) => {
  const [{ groupUsage }, dispatcher] = useModule(GroupUsageModule)

  useEffect(() => {
    if (groupId && startTime && endTime) {
      dispatcher.getGroupUsage({
        id: groupId,
        from: dayjs.unix(startTime).toISOString(),
        to: dayjs.unix(endTime).toISOString(),
      })
    }
  }, [dispatcher, endTime, groupId, startTime])

  return (
    <Table
      items={groupUsage}
      selectionMode={SelectionMode.none}
      columns={columns}
      disableVirtualization={groupUsage.length < 100}
    />
  )
})
