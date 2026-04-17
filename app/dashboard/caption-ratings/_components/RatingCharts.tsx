'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export type RatingChartData = {
  votesByDay: { date: string; up: number; down: number }[]
  upDownSplit: { name: string; value: number }[]
  ratingsByFlavor: { flavor: string; up: number; down: number; total: number }[]
  ratedVsUnrated: { name: string; value: number }[]
}

const SPLIT_COLORS = ['#34d399', '#f87171']
const COVERAGE_COLORS = ['#fb923c', '#d1d5db']

export default function RatingCharts({ data }: { data: RatingChartData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      {/* Votes per day */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Rating Activity (Last 30 Days)</h3>
        <p className="text-xs text-gray-400 mb-3">Upvotes and downvotes per day</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.votesByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="up" name="Upvotes" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="down" name="Downvotes" stroke="#f87171" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Up vs down pie */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Upvotes vs Downvotes</h3>
        <p className="text-xs text-gray-400 mb-3">Overall vote distribution</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.upDownSplit}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={75}
              label={(entry: any) => `${entry.name}: ${entry.value.toLocaleString()}`}
              labelLine={false}
            >
              {data.upDownSplit.map((_, i) => (
                <Cell key={i} fill={SPLIT_COLORS[i % SPLIT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Ratings by flavor */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Ratings by Humor Flavor</h3>
        <p className="text-xs text-gray-400 mb-3">Total votes per flavor category (top 8)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.ratingsByFlavor}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="flavor" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="up" name="Upvotes" stackId="a" fill="#34d399" />
            <Bar dataKey="down" name="Downvotes" stackId="a" fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rated vs unrated pie */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Rating Coverage</h3>
        <p className="text-xs text-gray-400 mb-3">Share of captions that have received at least one rating</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.ratedVsUnrated}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={75}
              label={(entry: any) => `${entry.name}: ${entry.value.toLocaleString()}`}
              labelLine={false}
            >
              {data.ratedVsUnrated.map((_, i) => (
                <Cell key={i} fill={COVERAGE_COLORS[i % COVERAGE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
