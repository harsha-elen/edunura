import { Request, Response } from 'express';
import CourseCategory from '../../models/CourseCategory';
import { Op } from 'sequelize';

// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const { search, status, featured } = req.query;

        const whereClause: any = {};

        // Add search filter
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { slug: { [Op.like]: `%${search}%` } },
            ];
        }

        // Add status filter
        if (status === 'active') {
            whereClause.is_active = true;
        } else if (status === 'inactive') {
            whereClause.is_active = false;
        }

        // Add featured filter
        if (featured === 'true') {
            whereClause.is_featured = true;
        }

        const categories = await CourseCategory.findAll({
            where: whereClause,
            order: [
                ['is_featured', 'DESC'],
                ['display_order', 'ASC'],
                ['name', 'ASC']
            ],
        });

        return res.status(200).json({
            status: 'success',
            data: categories,
        });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories',
            error: error.message,
        });
    }
};

// Get single category by ID
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const category = await CourseCategory.findByPk(id);

        if (!category) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: category,
        });
    } catch (error: any) {
        console.error('Error fetching category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch category',
            error: error.message,
        });
    }
};

// Create new category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const {
            name,
            slug,
            description,
            parent_id,
            icon,
            color,
            accent_color,
            display_order,
            is_featured,
            is_active,
        } = req.body;

        // Validation
        if (!name || !slug) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and slug are required',
            });
        }

        // Validate parent_id if provided
        if (parent_id) {
            const parentCategory = await CourseCategory.findByPk(parent_id);
            if (!parentCategory) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Parent category not found',
                });
            }
        }

        // Check if category with same name or slug already exists
        const existingCategory = await CourseCategory.findOne({
            where: {
                [Op.or]: [{ name }, { slug }],
            },
        });

        if (existingCategory) {
            return res.status(409).json({
                status: 'error',
                message: existingCategory.name === name 
                    ? 'Category with this name already exists'
                    : 'Category with this slug already exists',
            });
        }

        // Create category
        const category = await CourseCategory.create({
            name,
            slug,
            description,
            parent_id: parent_id || null,
            icon,
            color: color || '#2b8cee',
            accent_color: accent_color || '#e8f2fe',
            display_order: display_order || 0,
            is_featured: is_featured || false,
            is_active: is_active !== undefined ? is_active : true,
            course_count: 0,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Category created successfully',
            data: category,
        });
    } catch (error: any) {
        console.error('Error creating category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create category',
            error: error.message,
        });
    }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            parent_id,
            icon,
            color,
            accent_color,
            display_order,
            is_featured,
            is_active,
        } = req.body;

        const category = await CourseCategory.findByPk(id);

        if (!category) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
        }

        // Validate parent_id if being changed
        if (parent_id !== undefined) {
            if (parent_id === category.id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Category cannot be its own parent',
                });
            }
            if (parent_id !== null) {
                const parentCategory = await CourseCategory.findByPk(parent_id);
                if (!parentCategory) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Parent category not found',
                    });
                }
            }
        }

        // Check if name or slug is being changed and if it conflicts
        if (name && name !== category.name) {
            const existingName = await CourseCategory.findOne({ where: { name } });
            if (existingName && existingName.id !== category.id) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Category with this name already exists',
                });
            }
        }

        if (slug && slug !== category.slug) {
            const existingSlug = await CourseCategory.findOne({ where: { slug } });
            if (existingSlug && existingSlug.id !== category.id) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Category with this slug already exists',
                });
            }
        }

        // Update fields
        if (name !== undefined) category.name = name;
        if (slug !== undefined) category.slug = slug;
        if (description !== undefined) category.description = description;
        if (parent_id !== undefined) category.parent_id = parent_id;
        if (icon !== undefined) category.icon = icon;
        if (color !== undefined) category.color = color;
        if (accent_color !== undefined) category.accent_color = accent_color;
        if (display_order !== undefined) category.display_order = display_order;
        if (is_featured !== undefined) category.is_featured = is_featured;
        if (is_active !== undefined) category.is_active = is_active;

        await category.save();

        return res.status(200).json({
            status: 'success',
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error: any) {
        console.error('Error updating category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update category',
            error: error.message,
        });
    }
};

// Delete category (soft delete by setting is_active to false)
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query;

        const category = await CourseCategory.findByPk(id);

        if (!category) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found',
            });
        }

        // Check if category has courses
        if (category.course_count > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot delete category with ${category.course_count} courses. Please reassign or delete the courses first.`,
            });
        }

        if (permanent === 'true') {
            // Permanent delete
            await category.destroy();
            return res.status(200).json({
                status: 'success',
                message: 'Category permanently deleted',
            });
        } else {
            // Soft delete
            category.is_active = false;
            await category.save();
            return res.status(200).json({
                status: 'success',
                message: 'Category deactivated successfully',
                data: category,
            });
        }
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete category',
            error: error.message,
        });
    }
};

// Get category statistics
export const getCategoryStats = async (_req: Request, res: Response) => {
    try {
        const totalCategories = await CourseCategory.count();
        const activeCategories = await CourseCategory.count({ where: { is_active: true } });
        const inactiveCategories = await CourseCategory.count({ where: { is_active: false } });
        const featuredCategories = await CourseCategory.count({ where: { is_featured: true } });

        // Get total courses across all categories
        const categories = await CourseCategory.findAll({
            attributes: ['course_count'],
        });
        const totalCourses = categories.reduce((sum, cat) => sum + cat.course_count, 0);

        return res.status(200).json({
            status: 'success',
            data: {
                total: totalCategories,
                active: activeCategories,
                inactive: inactiveCategories,
                featured: featuredCategories,
                totalCourses,
            },
        });
    } catch (error: any) {
        console.error('Error fetching category stats:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch category statistics',
            error: error.message,
        });
    }
};
