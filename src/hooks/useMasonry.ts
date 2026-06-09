import { useEffect, useState } from "react";

import type { ImageItem } from "@/components/ui/image-gallery";

export interface MasonryItem extends ImageItem {
    x: number;
    y: number;
    displayHeight: number;
    displayWidth: number;
}

export interface MasonryConfig {
    gap: number;
    columns: number;
}

const useMasonry = (
    images: ImageItem[],
    containerWidth: number,
    config: MasonryConfig,
) => {
    const [layout, setLayout] = useState<MasonryItem[]>([]);
    const [totalHeight, setTotalHeight] = useState(0);

    useEffect(() => {
        if (!containerWidth || images.length === 0 || config.columns < 1)
            return;

        // Column-based masonry with no gaps - scale images to fill column width
        const totalGapWidth = config.gap * (config.columns - 1);
        const availableWidth = containerWidth - totalGapWidth;
        const columnWidth = availableWidth / config.columns;

        const columnHeights: number[] = Array(config.columns).fill(0);
        const columnImages: ImageItem[][] = Array(config.columns)
            .fill(null)
            .map(() => []);

        // Distribute images to columns (shortest first)
        images.forEach((image) => {
            const columnIndex = columnHeights.indexOf(
                Math.min(...columnHeights),
            );

            // Use provided dimensions or default to square (1:1) aspect ratio
            const aspectRatio =
                image.width && image.height ? image.width / image.height : 1; // Default to square if dimensions not provided

            let displayWidth = columnWidth;
            if (images.length === 1 && image.width && image.width < containerWidth) {
                displayWidth = image.width;
            }
            
            let displayHeight = displayWidth / aspectRatio;
            
            if (displayHeight > 600) {
                displayHeight = 600;
            }

            columnHeights[columnIndex] += displayHeight + config.gap;
            columnImages[columnIndex]?.push(image);
        });

        // Now position images in their columns and scale to fill gaps
        const newLayout: MasonryItem[] = [];
        const maxHeight = Math.max(...columnHeights) - config.gap;

        columnImages.forEach((column, colIndex) => {
            if (column.length === 0) return;

            // Calculate total height used by images without gaps
            let totalImageHeight = 0;
            column.forEach((image) => {
                // Handle optional dimensions
                const aspectRatio =
                    image.width && image.height
                        ? image.width / image.height
                        : 1;
                let displayWidth = columnWidth;
                if (images.length === 1 && image.width && image.width < containerWidth) {
                    displayWidth = image.width;
                }
                
                let displayHeight = displayWidth / aspectRatio;
                if (displayHeight > 600) displayHeight = 600;
                totalImageHeight += displayHeight;
            });

            // Scale factor to fill the entire column height
            const totalGaps = config.gap * (column.length - 1);
            const scaleFactor = (maxHeight - totalGaps) / totalImageHeight;

            // Position images in column with scaling
            let columnY = 0;
            column.forEach((image) => {
                // Handle optional dimensions
                const aspectRatio =
                    image.width && image.height
                        ? image.width / image.height
                        : 1;
                
                let displayWidth = columnWidth;
                if (images.length === 1 && image.width && image.width < containerWidth) {
                    displayWidth = image.width;
                }
                
                let displayHeight = (displayWidth / aspectRatio) * scaleFactor;

                // Clamp extreme heights for very tall portrait images
                if (displayHeight > 600) {
                    displayHeight = 600;
                }

                let x = colIndex * (columnWidth + config.gap);
                const y = columnY;

                // Center single unstretched images
                if (images.length === 1 && displayWidth < containerWidth) {
                    x = (containerWidth - displayWidth) / 2;
                }

                newLayout.push({
                    ...image,
                    x,
                    y,
                    displayWidth,
                    displayHeight,
                });

                columnY += displayHeight + config.gap;
            });
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLayout(newLayout);
        setTotalHeight(maxHeight);
    }, [images, containerWidth, config.gap, config.columns]);

    return {
        layout,
        totalHeight,
    };
};

export { useMasonry };
