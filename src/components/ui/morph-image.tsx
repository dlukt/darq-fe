"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type React from "react";

import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";

import { useClickOutside } from "@/hooks/useClickOutside";
import { useEventListener } from "@/hooks/useEventListener";
import { cn } from "@/lib/utils";


interface MorphImageProps extends HTMLMotionProps<"img"> {
    type?: "image" | "video" | "gifv" | "audio" | "unknown";
    onLoadError?: () => void;
}

const MorphImage: React.FC<MorphImageProps> = ({
    src,
    className,
    alt,
    onClick,
    type = "image",
    onLoadError,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasError, setHasError] = useState(false);

    const imageRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
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

    // Missing source can never render — avoid an empty (black) tile.
    if (!src) return null;

    // Unsupported attachment types must not render as a broken image/video tile.
    if (type === "unknown") return null;

    if (hasError) return null;

    const handleLoadError = () => {
        setHasError(true);
        setIsOpen(false);
        onLoadError?.();
    };

    if (type === "audio") {
        return (
            <audio
                src={src}
                controls
                preload="metadata"
                className={cn("w-full", className)}
                aria-label={typeof alt === "string" ? alt : "Audio attachment"}
                onError={handleLoadError}
            />
        );
    }

    const isVideo = type === "video" || type === "gifv";

    const thumbnail = isVideo ? (
        <video
            src={src}
            className={cn(
                "w-full h-full object-cover object-center not-prose cursor-zoom-in",
                className,
            )}
            onClick={() => setIsOpen(true)}
            onError={handleLoadError}
            autoPlay={type === "gifv"}
            loop={type === "gifv"}
            muted
            playsInline
            {...(props as unknown as React.ComponentProps<"video">)}
        />
    ) : (
        <motion.img
            src={src}
            alt={alt}
            className={cn(
                "w-full h-full object-cover object-center not-prose cursor-zoom-in",
                className,
            )}
            onClick={() => setIsOpen(true)}
            onError={handleLoadError}
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
