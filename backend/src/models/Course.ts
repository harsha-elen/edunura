import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum CourseStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
}

export enum CourseLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
}

interface CourseAttributes {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    thumbnail?: string;
    intro_video?: string;
    is_published: boolean;
    category?: string;
    level: CourseLevel;
    status: CourseStatus;
    price: number;
    is_free: boolean;
    duration_hours?: number;
    validity_period?: number;
    enrollment_limit?: number;
    total_enrollments: number;
    rating?: number;
    total_reviews: number;
    discounted_price?: number;
    outcomes?: string[]; // What you'll learn
    prerequisites?: string[];
    instructors?: { id: number; name: string; email: string; avatar?: string }[];
    // Settings Tab Fields
    enable_discussion_forum?: boolean;
    show_course_rating?: boolean;
    enable_certificate?: boolean;
    meta_title?: string;
    meta_description?: string;
    visibility?: 'draft' | 'published' | 'private';
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'total_enrollments' | 'total_reviews'> { }

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    public id!: number;
    public title!: string;
    public slug!: string;
    public description!: string;
    public short_description?: string;
    public thumbnail?: string;
    public intro_video?: string;
    public category?: string;
    public is_published!: boolean;
    public level!: CourseLevel;
    public status!: CourseStatus;
    public price!: number;
    public is_free!: boolean;
    public duration_hours?: number;
    public validity_period?: number;
    public enrollment_limit?: number;
    public total_enrollments!: number;
    public rating?: number;
    public total_reviews!: number;
    public discounted_price?: number;
    public outcomes?: string[];
    public prerequisites?: string[];
    public instructors?: { id: number; name: string; email: string; avatar?: string }[];
    public enable_discussion_forum?: boolean;
    public show_course_rating?: boolean;
    public enable_certificate?: boolean;
    public meta_title?: string;
    public meta_description?: string;
    public visibility?: 'draft' | 'published' | 'private';
    public created_by!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Course.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        short_description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        thumbnail: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        intro_video: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        level: {
            type: DataTypes.ENUM(...Object.values(CourseLevel)),
            allowNull: false,
            defaultValue: CourseLevel.BEGINNER,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(CourseStatus)),
            allowNull: false,
            defaultValue: CourseStatus.DRAFT,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        is_free: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        duration_hours: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        validity_period: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Access duration in days. Null means lifetime access.',
        },
        enrollment_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_enrollments: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
        },
        total_reviews: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        discounted_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
        },
        outcomes: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        instructors: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        prerequisites: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        enable_discussion_forum: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Allow students to post questions and engage in discussions',
        },
        show_course_rating: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Display student ratings and reviews on the course landing page',
        },
        enable_certificate: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Automatically issue a certificate to students who finish the course',
        },
        meta_title: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'SEO meta title for search engines (50-60 characters recommended)',
        },
        meta_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'SEO meta description (150-160 characters recommended)',
        },
        visibility: {
            type: DataTypes.ENUM('draft', 'published', 'private'),
            defaultValue: 'draft',
            comment: 'draft=admins only, published=all students, private=invite only',
        },
        created_by: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'courses',
    }
);

export default Course;
