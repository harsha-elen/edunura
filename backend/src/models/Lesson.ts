import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { LessonResource } from './LessonResource';

export enum LessonType {
    VIDEO = 'video',
    QUIZ = 'quiz',
    TEXT = 'text',
    DOCUMENT = 'document',
    LIVE = 'live',
}

interface LessonAttributes {
    id: number;
    section_id: number;
    title: string;
    content_type: LessonType;
    content_body?: string;
    file_path?: string; // Path to local asset
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    order: number;
    duration?: number; // In minutes
    is_free_preview: boolean;
    is_published: boolean;
    start_time?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface LessonCreationAttributes extends Optional<LessonAttributes, 'id' | 'is_published' | 'order' | 'is_free_preview' | 'content_body' | 'file_path' | 'zoom_meeting_id' | 'zoom_join_url' | 'duration'> { }

class Lesson extends Model<LessonAttributes, LessonCreationAttributes> implements LessonAttributes {
    public id!: number;
    public section_id!: number;
    public title!: string;
    public content_type!: LessonType;
    public content_body?: string;
    public file_path?: string;
    public zoom_meeting_id?: string;
    public zoom_join_url?: string;
    public order!: number;
    public duration?: number;
    public is_free_preview!: boolean;
    public is_published!: boolean;
    public start_time?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Lesson.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        section_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'course_sections',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        content_type: {
            type: DataTypes.ENUM(...Object.values(LessonType)),
            allowNull: false,
            defaultValue: LessonType.TEXT,
        },
        content_body: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        zoom_meeting_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        zoom_join_url: {
            type: DataTypes.STRING(1000),
            allowNull: true,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_free_preview: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'lessons',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

Lesson.hasMany(LessonResource, {
    sourceKey: 'id',
    foreignKey: 'lesson_id',
    as: 'resources',
});

LessonResource.belongsTo(Lesson, {
    targetKey: 'id',
    foreignKey: 'lesson_id',
    as: 'lesson',
});

export default Lesson;
