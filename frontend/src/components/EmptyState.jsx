import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-indigo-400" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg text-ink-900">{title}</h3>
      {description && <p className="text-ink-500 text-sm mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
