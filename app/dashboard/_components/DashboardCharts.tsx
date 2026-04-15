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

export type ChartData = {
  captionsPerDay: { date: string; count: number }[]
  captionsByFlavor: { flavor: string; count: number }[]
  publicVsPrivate: { name: string; value: number }[]
  votesByDay: { date: string; up: number; down: number }[]
}

const COLORS = ['#fb923c', '#60a5fa', '#34d399', '#a78bfa', '#f472b6', '#fbbf24', '#22d3ee', '#f87171']

export default function DashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      {/* Line chart — captions per day */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Captions Created (Last 30 Days)</h3>
        <p className="text-xs text-gray-400 mb-3">Daily volume of new captions</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.captionsPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="count" stroke="#fb923c" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — captions by humor flavor */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Captions by Humor Flavor</h3>
        <p className="text-xs text-gray-400 mb-3">Total captions per flavor category</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.captionsByFlavor}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="flavor" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.captionsByFlavor.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart — public vs private */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Caption Visibility</h3>
        <p className="text-xs text-gray-400 mb-3">Public vs private split</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.publicVsPrivate}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.publicVsPrivate.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked bar — votes per day */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Votes Cast (Last 30 Days)</h3>
        <p className="text-xs text-gray-400 mb-3">Upvotes vs downvotes per day</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.votesByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="up" stackId="v" fill="#34d399" name="Upvotes" />
            <Bar dataKey="down" stackId="v" fill="#f87171" name="Downvotes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
