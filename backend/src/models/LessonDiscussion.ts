import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Lesson from './Lesson';

interface LessonDiscussionAttributes {
    id: number;
    lesson_id: number;
    user_id: number;
    content: string;
    created_at?: Date;
    updated_at?: Date;
}

interface LessonDiscussionCreationAttributes extends Optional<LessonDiscussionAttributes, 'id'> {}

class LessonDiscussion extends Model<LessonDiscussionAttributes, LessonDiscussionCreationAttributes> implements LessonDiscussionAttributes {
    public id!: number;
    public lesson_id!: number;
    public user_id!: number;
    public content!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public user?: User;
    public lesson?: Lesson;
}

LessonDiscussion.init(
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
                model: 'lessons',
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'lesson_discussions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default LessonDiscussion;
