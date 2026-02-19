import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CourseCategoryAttributes {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    icon?: string;
    color?: string;
    accent_color?: string;
    course_count: number;
    display_order: number;
    is_featured: boolean;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface CourseCategoryCreationAttributes 
    extends Optional<CourseCategoryAttributes, 'id' | 'course_count' | 'display_order' | 'is_featured' | 'is_active'> {}

class CourseCategory extends Model<CourseCategoryAttributes, CourseCategoryCreationAttributes> 
    implements CourseCategoryAttributes {
    public id!: number;
    public name!: string;
    public slug!: string;
    public description?: string;
    public parent_id?: number;
    public icon?: string;
    public color?: string;
    public accent_color?: string;
    public course_count!: number;
    public display_order!: number;
    public is_featured!: boolean;
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CourseCategory.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        slug: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        parent_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'course_categories',
                key: 'id',
            },
            comment: 'Parent category ID for hierarchical structure',
        },
        icon: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Icon name or path',
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#2b8cee',
            comment: 'Primary color for category',
        },
        accent_color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#e8f2fe',
            comment: 'Accent/background color',
        },
        course_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0,
            comment: 'Total number of courses in this category',
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Order for displaying categories',
        },
        is_featured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Featured categories appear first',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Active categories are visible to users',
        },
    },
    {
        sequelize,
        tableName: 'course_categories',
        indexes: [
            {
                unique: true,
                fields: ['name'],
            },
            {
                unique: true,
                fields: ['slug'],
            },
            {
                fields: ['is_active'],
            },
            {
                fields: ['is_featured'],
            },
            {
                fields: ['display_order'],
            },
            {
                fields: ['parent_id'],
            },
        ],
    }
);

export default CourseCategory;
