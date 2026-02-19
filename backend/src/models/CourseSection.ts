import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CourseSectionAttributes {
    id: number;
    course_id: number;
    title: string;
    order: number;
    is_published: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface CourseSectionCreationAttributes extends Optional<CourseSectionAttributes, 'id' | 'is_published' | 'order'> { }

class CourseSection extends Model<CourseSectionAttributes, CourseSectionCreationAttributes> implements CourseSectionAttributes {
    public id!: number;
    public course_id!: number;
    public title!: string;
    public order!: number;
    public is_published!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CourseSection.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        course_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'course_sections',
        timestamps: true,
        underscored: true,
    }
);

export default CourseSection;
