"use client";
import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import type React from "react";

import { AnimatePresence, motion, type Transition, type HTMLMotionProps } from "framer-motion";

import { useClickOutside } from "@/hooks/useClickOutside";
import { useEventListener } from "@/hooks/useEventListener";
import { cn } from "@/lib/utils";

const transition: Transition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
    type: "spring",
    stiffness: 120,
    damping: 15,
};

interface MorphImageProps extends HTMLMotionProps<"img"> {
    type?: "image" | "video" | "gifv" | "audio" | "unknown";
}

const MorphImage: React.FC<MorphImageProps> = ({
    src,
    className,
    alt,
    onClick,
    type = "image",
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const imageRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
    const generatedId = useId();
    // Using src as part of the layoutId is crucial to prevent framer-motion from
    // animating bounds when a virtualized list recycles the component for a different image.

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        return () => setMounted(false);
    }, []);

    useClickOutside({
        ref: imageRef,
        callback: () => setIsOpen(false),
    });

    useEventListener("scroll", () => isOpen && setIsOpen(false));

    const handleClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
        onClick?.(e);
    };

    if (!mounted) return null;

    const isVideo = type === "video" || type === "gifv";

    const thumbnail = isVideo ? (
        <video
            src={src}
            className={cn(
                "w-full h-full object-cover object-center not-prose cursor-zoom-in",
                className,
            )}
            onClick={() => setIsOpen(true)}
            autoPlay={type === "gifv"}
            loop={type === "gifv"}
            muted
            playsInline
            {...(props as unknown as React.ComponentProps<"video">)}
        />
    ) : (
        <img
            src={src}
            alt={alt}
            className={cn(
                "w-full h-full object-cover object-center not-prose cursor-zoom-in",
                className,
            )}
            onClick={() => setIsOpen(true)}
            {...props}
        />
    );

    const modal = createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-40 bg-black/80 cursor-pointer"
                        initial={{ opacity: 0, pointerEvents: "none" }}
                        animate={{ opacity: 1, pointerEvents: "auto" }}
                        exit={{ opacity: 0, pointerEvents: "none" }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        key="container"
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none "
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {isVideo ? (
                            <motion.video
                                ref={imageRef}
                                src={src}
                                className={cn(
                                    "object-cover object-center max-w-[100vw] max-h-[100dvh] pointer-events-auto cursor-zoom-out rounded-none overflow-hidden",
                                )}
                                onClick={(e) => handleClick(e as unknown as React.MouseEvent<HTMLImageElement>)}
                                autoPlay
                                controls={type === "video"}
                                loop={type === "gifv"}
                                playsInline
                            />
                        ) : (
                            <motion.img
                                ref={imageRef}
                                src={src}
                                alt={alt}
                                className={cn(
                                    "object-cover object-center max-w-[100vw] max-h-[100dvh] pointer-events-auto cursor-zoom-out rounded-none overflow-hidden",
                                )}
                                onClick={(e) => handleClick(e)}
                            />
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body,
    );

    return (
        <div className="w-full h-full flex items-center justify-center">
            <picture className="w-full h-full">{thumbnail}</picture>
            {modal}
        </div>
    );
};

export default MorphImage;
