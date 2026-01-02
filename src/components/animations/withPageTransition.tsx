import { motion } from 'framer-motion';
import { ComponentType } from 'react';

// HOC to add page transition to any component
export function withPageTransition<P extends object>(
    Component: ComponentType<P>
) {
    return function PageTransitionWrapper(props: P) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                }}
            >
                <Component {...props} />
            </motion.div>
        );
    };
}
