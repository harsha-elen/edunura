import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Lesson from './Lesson';

interface LessonResourceAttributes {
    id: number;
    lesson_id: number;
    title: string;
    file_path: string;
    file_size: string;
    file_type: string;
    created_at?: Date;
    updated_at?: Date;
}

interface LessonResourceCreationAttributes extends Optional<LessonResourceAttributes, 'id'> { }

export class LessonResource extends Model<LessonResourceAttributes, LessonResourceCreationAttributes> implements LessonResourceAttributes {
    public id!: number;
    public lesson_id!: number;
    public title!: string;
    public file_path!: string;
    public file_size!: string;
    public file_type!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LessonResource.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        lesson_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: Lesson,
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_size: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'lesson_resources',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
