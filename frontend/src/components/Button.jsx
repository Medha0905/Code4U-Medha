import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
